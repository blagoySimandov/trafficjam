import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageContainer from '../components/PageContainer';
import Button from '../components/Button';
import './MapSelectionPage.css';

const MapSelectionPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radius, setRadius] = useState(5);
  
  return (
    <PageContainer>
      <div className="map-selection-layout">
        {/* Left Panel */}
        <motion.div 
          className="map-panel glass-morphism"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="panel-header">
            <Button 
              variant="ghost" 
              size="small"
              onClick={() => navigate('/projects')}
            >
              ← Projects
            </Button>
          </div>
          
          <div className="panel-content">
            <h2 className="panel-title">Map Selection</h2>
            <p className="panel-subtitle">
              Select which project area you want to work on
            </p>
            
            <div className="form-group">
              <label className="form-label">Pin Location</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="51.89 93.3"
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">
                Network radius
                <span className="label-value">{radius}km</span>
              </label>
              <input 
                type="range" 
                className="form-range" 
                min="1"
                max="20"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
            </div>
            
            <div className="panel-actions">
              <Button 
                variant="primary"
                size="large"
                onClick={() => navigate(`/projects/${projectId}/network-editor`)}
                style={{ width: '100%' }}
              >
                Save Network
              </Button>
            </div>
          </div>
        </motion.div>
        
        {/* Right Map Area */}
        <motion.div 
          className="map-viewport glass-morphism"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="map-placeholder">
            <div className="map-placeholder-content">
              <motion.div
                className="abstract-shape shape-1"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <motion.div
                className="abstract-shape shape-2"
                animate={{ 
                  rotate: -360,
                  scale: [1, 0.9, 1]
                }}
                transition={{ 
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <h3 className="map-placeholder-title">MapBox Map</h3>
              <p className="map-placeholder-text">
                Contains blue radius to show selection of network.
                <br />
                User can pan/zoom
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
};

export default MapSelectionPage;
