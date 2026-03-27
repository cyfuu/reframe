import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '/logo.svg'; 

export function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      {/* Hero Section */}
      <div className="max-w-3xl space-y-6 flex flex-col items-center">
        
        <img 
          src={logo} 
          alt="Reframe Logo" 
          className="w-24 h-24 mb-4 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
        />

        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Reframe.</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          This is where I document the journey, ship updates, and share the evolution of my projects.
        </p>

        <div className="pt-8">
          <Link 
            to="/projects" 
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-black bg-white rounded-full hover:bg-gray-200 transition-colors"
          >
            View Projects
          </Link>
        </div>
      </div>
    </div>
  );
}