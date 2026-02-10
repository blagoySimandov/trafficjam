import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pen, Pencil, Trash2, Plus } from 'lucide-react';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import './NetworkEditorPage.css';

const NetworkEditorPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  return (
    <PageContainer className="editor-page">
      {/* Top Bar */}
      <motion.div 
        className="editor-toolbar glass-morphism"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="toolbar-section">
          <Button
            variant="ghost"
            size="small"
            onClick={() => navigate('/projects')}
          >
            ← Projects
          </Button>
          <h2 className="toolbar-title">Network editor</h2>
        </div>
        
        <div className="toolbar-section">
          <Button variant="secondary" size="small">Save</Button>
          <Button variant="secondary" size="small">Save config</Button>
          <Button 
            variant="primary"
            onClick={() => navigate(`/projects/${projectId}/simulation`)}
          >
            Run Simulation
          </Button>
        </div>
      </motion.div>
      
      {/* Editor Area */}
      <motion.div 
        className="editor-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Side Panel */}
        <div className="editor-panel glass-morphism">
          <div className="panel-section">
            <h3 className="panel-section-title">Network visualizations</h3>
            <div className="panel-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Show nodes as dots</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Show links as lines</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Actual road visualization</span>
              </label>
            </div>
          </div>
          
          <div className="panel-section">
            <h3 className="panel-section-title">Config</h3>
            <div className="config-list">
              <div className="config-item">
                <span>Iterations</span>
                <span className="config-value">100</span>
              </div>
              <div className="config-item">
                <span>Random Seed</span>
                <span className="config-value">4711</span>
              </div>
              <div className="config-item">
                <span>Coord. System</span>
                <span className="config-value">EPSG:2157</span>
              </div>
            </div>
          </div>
          
          <div className="panel-section">
            <h3 className="panel-section-title">Edit Network</h3>
            <div className="tool-grid">
              <button className="tool-button">
                <Pen size={20} strokeWidth={2} />
              </button>
              <button className="tool-button">
                <Pencil size={20} strokeWidth={2} />
              </button>
              <button className="tool-button">
                <Trash2 size={20} strokeWidth={2} />
              </button>
              <button className="tool-button">
                <Plus size={20} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Editor */}
        <div className="editor-viewport glass-morphism">
          <div className="viewport-placeholder">
            <motion.div
              className="editor-abstract-bg"
              animate={{ 
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{ 
                duration: 30,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'linear'
              }}
            />
            <div className="viewport-content">
              <h3 className="viewport-title">Network Editor Canvas</h3>
              <p className="viewport-text">
                This area will contain the map editor component.
                <br />
                Other team members will plug their editor here.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default NetworkEditorPage;
