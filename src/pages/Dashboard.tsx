import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { NewProjectModal } from '../components/NewProjectModal';
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Projects</h1>
          <p className="text-gray-500">Select a repository to view its changelog.</p>
        </div>
        
        <div className="w-full sm:w-auto">
          {user && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="w-full sm:w-auto block text-center bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              + New Project
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-12 animate-pulse">
          Loading projects from Supabase...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center border border-dashed border-gray-800 rounded-xl py-12 text-gray-500">
          No projects found. Click "New Project" to add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <div key={project.id} className="relative group">
              <Link to={`/project/${project.id}`} className="block">
                 <ProjectCard project={project} onClick={() => {}} />
              </Link>

              {user && (
                <button 
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className="absolute bottom-4 right-4 bg-[#0a0a0a] border border-gray-800 p-2 rounded-lg text-gray-500 hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 z-10"
                  title="Delete Project"
                >
                  🗑️
                </button>
              )}
            </div>
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