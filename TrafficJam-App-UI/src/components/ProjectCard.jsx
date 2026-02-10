import { motion } from 'framer-motion';
import './ProjectCard.css';

const ProjectCard = ({ 
  project, 
  onSelect, 
  onDelete,
  index = 0 
}) => {
  // Abstract art color based on index
  const accentColors = [
    'var(--accent-blue)',
    'var(--accent-purple)',
    'var(--accent-yellow)',
    'var(--accent-red)',
  ];
  
  const accent = accentColors[index % accentColors.length];
  
  return (
    <motion.div
      className="project-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onSelect}
    >
      <div className="project-card-accent" style={{ background: accent }} />
      
      <div className="project-card-content">
        <h3 className="project-card-title">{project.name}</h3>
        
        <div className="project-card-meta">
          <span className="meta-item">
            <span className="meta-label">Last edited</span>
            <span className="meta-value">{project.lastEdited}</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">Network</span>
            <span className="meta-value">{project.network}</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">Simulation</span>
            <span className="meta-value">{project.simulation}</span>
          </span>
        </div>
      </div>
      
      <motion.button
        className="project-card-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        ×
      </motion.button>
    </motion.div>
  );
};

export default ProjectCard;
