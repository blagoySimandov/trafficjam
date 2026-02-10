import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import './SimulationPage.css';

const SimulationPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  
  const totalIterations = 100;
  
  useEffect(() => {
    if (isRunning && progress < 100) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + 1, 100);
          setCurrentIteration(Math.floor((newProgress / 100) * totalIterations));
          return newProgress;
        });
      }, 150);
      
      return () => clearInterval(interval);
    } else if (progress >= 100) {
      setIsRunning(false);
    }
  }, [isRunning, progress]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = now - startTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);
    
    return () => clearInterval(timer);
  }, [startTime]);
  
  const handleStop = () => {
    setIsRunning(false);
    navigate(`/projects/${projectId}/results`);
  };
  
  return (
    <PageContainer className="simulation-page">
      <motion.div 
        className="simulation-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="simulation-header">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
          >
            ← Projects
          </Button>
        </div>
        
        <div className="simulation-content">
          <motion.div 
            className="status-indicator"
            animate={{ 
              scale: isRunning ? [1, 1.05, 1] : 1,
            }}
            transition={{ 
              duration: 2,
              repeat: isRunning ? Infinity : 0 
            }}
          >
            <div className={`status-dot ${isRunning ? 'running' : 'stopped'}`} />
            <span className="status-text">
              {isRunning ? 'Running simulation' : 'Simulation complete'}
            </span>
          </motion.div>
          
          <h1 className="simulation-title">Simulation Running</h1>
          
          <div className="stats-grid">
            <div className="stat-card glass-morphism">
              <div className="stat-label">Iteration</div>
              <div className="stat-value">{currentIteration} / {totalIterations}</div>
            </div>

            <div className="stat-card glass-morphism">
              <div className="stat-label">Progress</div>
              <div className="stat-value">{progress}%</div>
            </div>

            <div className="stat-card glass-morphism">
              <div className="stat-label">Start Time</div>
              <div className="stat-value">{startTime.toLocaleTimeString('en-US', { hour12: false })}</div>
            </div>

            <div className="stat-card glass-morphism">
              <div className="stat-label">Elapsed Time</div>
              <div className="stat-value">{elapsedTime}</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar-bg">
              <motion.div 
                className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="simulation-actions">
            {isRunning ? (
              <Button 
                variant="danger" 
                size="large"
                onClick={handleStop}
              >
                Stop
              </Button>
            ) : (
              <Button 
                variant="primary" 
                size="large"
                onClick={() => navigate(`/projects/${projectId}/results`)}
              >
                View Results
              </Button>
            )}
          </div>
          
          {/* Log */}
          <div className="simulation-log glass-morphism">
            <div className="log-header">
              <span className="log-title">Simulation Log</span>
            </div>
            <div className="log-content">
              <div className="log-entry">
                <span className="log-time">{startTime.toLocaleTimeString()}</span>
                <span className="log-message">Simulation started using config.xml</span>
              </div>
              <div className="log-entry">
                <span className="log-time">{startTime.toLocaleTimeString()}</span>
                <span className="log-message">Network validation complete - 1283 nodes</span>
              </div>
              <div className="log-entry">
                <span className="log-time">{startTime.toLocaleTimeString()}</span>
                <span className="log-message">Agents initialized - 45,621 total</span>
              </div>
              {isRunning && (
                <div className="log-entry log-running">
                  <span className="log-time">Live</span>
                  <span className="log-message">Processing iteration {currentIteration}...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default SimulationPage;
