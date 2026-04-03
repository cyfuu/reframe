import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { NewProjectModal } from '../components/NewProjectModal';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*, logs(id)') 
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error.message);
      toast.error('Failed to load projects'); 
    } else if (data) {
      const formattedProjects: Project[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        repoUrl: row.repo_url,
        lastUpdated: new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
        }),
        logCount: row.logs ? row.logs.length : 0 
      }));
      setProjects(formattedProjects);
    }
    setIsLoading(false);
  }

  async function handleDeleteProject(e: React.MouseEvent, projectId: string) {
    e.preventDefault();
    const isConfirmed = window.confirm("Are you absolutely sure? This will delete the project and ALL its changelogs!");
    if (!isConfirmed) return;

    const toastId = toast.loading('Deleting project...');
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    
    if (error) {
      toast.error(`Error deleting project: ${error.message}`, { id: toastId });
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully', { id: toastId });
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <motion.div 
        className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight text-[var(--text-main)]">Projects</h1>
          <p className="text-[var(--text-muted)]">Select a repository to view its changelog.</p>
        </div>
        
        <div className="w-full sm:w-auto">
          {user && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="w-full sm:w-auto block text-center bg-[var(--text-main)] text-[var(--bg-app)] px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-all shadow-lg active:scale-95"
            >
              + New Project
            </button>
          )}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="text-center text-[var(--text-muted)] py-12 animate-pulse">
          Loading projects from Supabase...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center border border-dashed border-[var(--border-subtle)] rounded-xl py-12 text-[var(--text-muted)] bg-[var(--surface)]/30">
          No projects found. Click "New Project" to add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <motion.div 
              key={project.id} 
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link to={`/project/${project.id}`} className="block">
                 <ProjectCard project={project} onClick={() => {}} />
              </Link>

              {user && (
                <button 
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className="absolute bottom-4 right-4 bg-[var(--surface)] border border-[var(--border-subtle)] p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 z-10 shadow-sm"
                  title="Delete Project"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <NewProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchProjects();
          toast.success('Project created!');
        }} 
        existingProjects={projects}
      />
    </div>
  );
}