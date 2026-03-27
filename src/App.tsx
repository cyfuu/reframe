import { HashRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { ProjectTimeline } from './pages/ProjectTimeline';
import { Login } from './pages/Login';
import { WriteLog } from './pages/WriteLog';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="min-h-screen bg-black text-white p-8 md:p-16 flex flex-col items-center">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectTimeline />} />
            <Route path="/project/:id/write" element={<WriteLog />} />
            <Route path="/project/:id/edit/:logId" element={<WriteLog />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;