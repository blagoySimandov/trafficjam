import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProjectsPage from './pages/ProjectsPage';
import MapSelectionPage from './pages/MapSelectionPage';
import NetworkEditorPage from './pages/NetworkEditorPage';
import SimulationPage from './pages/SimulationPage';
import ResultsPage from './pages/ResultsPage';
import './styles/globals.css';

function App() {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/map-selection" element={<MapSelectionPage />} />
          <Route path="/projects/:projectId/network-editor" element={<NetworkEditorPage />} />
          <Route path="/projects/:projectId/simulation" element={<SimulationPage />} />
          <Route path="/projects/:projectId/results" element={<ResultsPage />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;
