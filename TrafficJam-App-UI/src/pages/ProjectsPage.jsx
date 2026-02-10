import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageContainer from '../components/PageContainer';
import ProjectCard from '../components/ProjectCard';
import Button from '../components/Button';
import './ProjectsPage.css';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Cork Network',
      lastEdited: '2 hours ago',
      network: '356.4km²',
      simulation: 'Run #5',
    },
    {
      id: 2,
      name: 'Dublin City',
      lastEdited: '1 day ago',
      network: '876.1km²',
      simulation: 'Run #12',
    },
  ]);
  
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now(),
        name: newProjectName,
        lastEdited: 'Just now',
        network: 'Not set',
        simulation: 'Run #0',
      };
      setProjects([newProject, ...projects]);
      setNewProjectName('');
      setShowNewProjectModal(false);
      navigate(`/projects/${newProject.id}/map-selection`);
    }
  };
  
  const handleDeleteProject = (id) => {
    setProjects(projects.filter(p => p.id !== id));
  };
  
  return (
    <PageContainer backgroundClassName="map-background">
      <div className="projects-header">
        <div className="header-text">
          <motion.h1 
            className="page-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Traffic Jam <span className="title-accent">network builder</span>
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Select a project to continue or create a new one
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button 
            variant="primary" 
            size="large"
            onClick={() => setShowNewProjectModal(true)}
          >
            New +
          </Button>
        </motion.div>
      </div>
      
      <div className="projects-grid">
        <AnimatePresence>
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onSelect={() => navigate(`/projects/${project.id}/map-selection`)}
              onDelete={() => handleDeleteProject(project.id)}
            />
          ))}
        </AnimatePresence>
      </div>
      
      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProjectModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewProjectModal(false)}
          >
            <motion.div
              className="modal glass-morphism"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="modal-title">Create New Project</h2>
              <input
                type="text"
                className="modal-input"
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                autoFocus
              />
              <div className="modal-actions">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowNewProjectModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                >
                  Create
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default ProjectsPage;
