import { HashRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProjectTimeline } from './pages/ProjectTimeline';

function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-black text-white p-8 md:p-16 flex flex-col items-center">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:id" element={<ProjectTimeline />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;