import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { AppShell } from './components/AppShell';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ProjectTimeline } from './pages/ProjectTimeline';
import { Login } from './pages/Login';
import { WriteLog } from './pages/WriteLog';

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter basename="/reframe">
            <Routes>
              <Route element={<AppShell />}>
                <Route path="/" element={<Landing />} />
                <Route path="/projects" element={<Dashboard />} />
                <Route path="/project/:id" element={<ProjectTimeline />} />
                <Route path="/project/:id/write" element={<WriteLog />} />
                <Route path="/project/:id/edit/:logId" element={<WriteLog />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;