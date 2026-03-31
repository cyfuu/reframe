import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Landing } from './pages/Landing';
import { Dashboard } from './pages/Dashboard';
import { ProjectTimeline } from './pages/ProjectTimeline';
import { Login } from './pages/Login';
import { WriteLog } from './pages/WriteLog';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/reframe">
        
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0a0a0a',
              color: '#fff',
              border: '1px solid #1f2937',
            },
            success: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />

        <div className="min-h-screen text-white p-8 md:p-16 flex flex-col items-center">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/projects" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectTimeline />} />
            <Route path="/project/:id/write" element={<WriteLog />} />
            <Route path="/project/:id/edit/:logId" element={<WriteLog />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;