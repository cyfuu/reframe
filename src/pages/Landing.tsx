import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
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
        
        <motion.img 
          src={logo} 
          alt="Reframe Logo" 
          className="w-24 h-24 mb-4 object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        <motion.h1 
          className="text-5xl md:text-7xl font-bold text-white tracking-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        >
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Reframe.</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          This is where I document the journey, ship updates, and share the evolution of my projects.
        </motion.p>

        <motion.div 
          className="pt-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.6 }}
        >
          <Link 
            to="/projects" 
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-black bg-white rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
          >
            View Projects
          </Link>
        </motion.div>
      </div>
    </div>
  );
}