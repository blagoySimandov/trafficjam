import { motion } from 'framer-motion';
import './PageContainer.css';

const PageContainer = ({ children, className = '', backgroundClassName = 'subtle-grid' }) => {
  return (
    <div className={`page-container ${className}`}>
      <div className={`page-background ${backgroundClassName}`} />
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
