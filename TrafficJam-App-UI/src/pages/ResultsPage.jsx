import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, Clock, BarChart3, Flame, ChevronDown, Play } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import './ResultsPage.css';

const ResultsPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedSimulation, setSelectedSimulation] = useState('sim-001');

  // Mock simulation runs data
  const simulations = [
    { id: 'sim-001', name: 'Baseline Run', date: '2024-01-15 14:30' },
    { id: 'sim-002', name: 'Traffic Lights Optimized', date: '2024-01-15 15:45' },
    { id: 'sim-003', name: 'Rush Hour Scenario', date: '2024-01-16 09:15' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'visualizer', label: 'Visualizer' },
    { id: 'performance', label: 'Key Metrics' },
    { id: 'routes', label: 'Route Analysis' },
    { id: 'comparison', label: 'Comparison Heatmap' },
  ];
  
  return (
    <PageContainer className="results-page">
      {/* Header */}
      <motion.div
        className="results-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="header-left">
          <Button
            variant="ghost"
            onClick={() => navigate('/projects')}
          >
            ← Projects
          </Button>
          <div className="header-info">
            <h1 className="results-title">Results</h1>
            <div className="simulation-selector glass-morphism">
              <select
                value={selectedSimulation}
                onChange={(e) => setSelectedSimulation(e.target.value)}
                className="simulation-dropdown"
              >
                {simulations.map(sim => (
                  <option key={sim.id} value={sim.id}>
                    {sim.name} - {sim.date}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="dropdown-icon" />
            </div>
          </div>
        </div>

        <div className="header-actions">
          <Button variant="secondary">Download ZIP</Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/projects/${projectId}/network-editor`)}
          >
            Edit Settings
          </Button>
        </div>
      </motion.div>
      
      {/* Tabs */}
      <motion.div 
        className="results-tabs glass-morphism"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            className={`tab ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            {tab.label}
          </motion.button>
        ))}
      </motion.div>
      
      {/* Content */}
      <motion.div 
        className="results-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {selectedTab === 'overview' && (
          <div className="results-grid">
            {/* Stats Cards */}
            <div className="metric-card glass-morphism">
              <div className="metric-icon" style={{ background: 'var(--accent-blue)' }}>
                <Car size={24} strokeWidth={2} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Avg Speed</div>
                <div className="metric-value">45.3 <span className="metric-unit">km/h</span></div>
                <div className="metric-change positive">+5.2% vs baseline</div>
              </div>
            </div>

            <div className="metric-card glass-morphism">
              <div className="metric-icon" style={{ background: 'var(--accent-teal)' }}>
                <Clock size={24} strokeWidth={2} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Avg Journey</div>
                <div className="metric-value">23.4 <span className="metric-unit">min</span></div>
                <div className="metric-change negative">-3.1% vs baseline</div>
              </div>
            </div>

            <div className="metric-card glass-morphism">
              <div className="metric-icon" style={{ background: 'var(--accent-yellow)' }}>
                <BarChart3 size={24} strokeWidth={2} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Completed</div>
                <div className="metric-value">98.7 <span className="metric-unit">%</span></div>
                <div className="metric-change positive">+2.4% vs baseline</div>
              </div>
            </div>

            <div className="metric-card glass-morphism">
              <div className="metric-icon" style={{ background: 'var(--accent-red)' }}>
                <Flame size={24} strokeWidth={2} />
              </div>
              <div className="metric-content">
                <div className="metric-label">Peak Congestion</div>
                <div className="metric-value">8:45 <span className="metric-unit">AM</span></div>
                <div className="metric-change neutral">0% vs baseline</div>
              </div>
            </div>

            {/* Charts */}
            <div className="chart-card glass-morphism span-2">
              <h3 className="chart-title">Multiple performers calculation over time</h3>
              <div className="chart-placeholder">
                <svg className="abstract-chart" viewBox="0 0 600 200">
                  {/* Abstract line chart visualization */}
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,150 Q 100,100 150,120 T 300,80 T 450,100 T 600,60"
                    fill="none"
                    stroke="url(#gradient1)"
                    strokeWidth="3"
                  />
                  <path
                    d="M 0,150 Q 100,100 150,120 T 300,80 T 450,100 T 600,60 L 600,200 L 0,200 Z"
                    fill="url(#gradient1)"
                  />
                </svg>
              </div>
            </div>

            <div className="chart-card glass-morphism span-2">
              <h3 className="chart-title">Mode share comparison</h3>
              <div className="chart-placeholder">
                <div className="bar-chart">
                  <div className="bar-group">
                    <div className="bar" style={{ height: '80%', background: 'var(--accent-blue)' }} />
                    <span className="bar-label">Car</span>
                  </div>
                  <div className="bar-group">
                    <div className="bar" style={{ height: '45%', background: 'var(--accent-purple)' }} />
                    <span className="bar-label">Bus</span>
                  </div>
                  <div className="bar-group">
                    <div className="bar" style={{ height: '30%', background: 'var(--accent-yellow)' }} />
                    <span className="bar-label">Walk</span>
                  </div>
                  <div className="bar-group">
                    <div className="bar" style={{ height: '15%', background: 'var(--accent-red)' }} />
                    <span className="bar-label">Bike</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'visualizer' && (
          <div className="visualizer-container">
            <div className="visualizer-viewport glass-morphism">
              <motion.div
                className="viewport-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="visualizer-placeholder">
                  <div className="visualizer-icon">
                    <Play size={48} strokeWidth={1.5} />
                  </div>
                  <h3 className="viewport-title">Simulation Visualizer</h3>
                  <p className="viewport-text">
                    The simulation playback component will be integrated here.
                    <br />
                    Watch cars, buses, and other agents navigate the network in real-time.
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="visualizer-controls glass-morphism">
              <div className="control-group">
                <label className="control-label">Playback Speed</label>
                <div className="speed-controls">
                  <button className="speed-button">0.5x</button>
                  <button className="speed-button active">1x</button>
                  <button className="speed-button">2x</button>
                  <button className="speed-button">5x</button>
                </div>
              </div>

              <div className="control-group">
                <label className="control-label">Display Options</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Show vehicles</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span>Show traffic signals</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span>Show congestion heatmap</span>
                  </label>
                </div>
              </div>

              <div className="control-group">
                <label className="control-label">Simulation Time</label>
                <div className="time-display">00:00:00 / 02:30:00</div>
                <input type="range" className="time-slider" min="0" max="100" defaultValue="0" />
              </div>
            </div>
          </div>
        )}

        {selectedTab !== 'overview' && selectedTab !== 'visualizer' && (
          <div className="placeholder-content glass-morphism">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3 className="placeholder-title">{tabs.find(t => t.id === selectedTab)?.label}</h3>
              <p className="placeholder-text">
                Visualizations and data for this section will appear here.
                <br />
                The visualization component can be plugged in by other team members.
              </p>
            </motion.div>
          </div>
        )}
      </motion.div>
    </PageContainer>
  );
};

export default ResultsPage;
