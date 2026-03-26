import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setIsLoading(true);
    
    // Grab all projects, newest first
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error.message);
    } else if (data) {
      // Map the database snake_case to our frontend camelCase types
      const formattedProjects: Project[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        repoUrl: row.repo_url,
        lastUpdated: new Date(row.created_at).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric'
        }),
        logCount: 0 // We will dynamically count the logs later!
      }));
      
      setProjects(formattedProjects);
    }
    
    setIsLoading(false);
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Projects</h1>
          <p className="text-gray-500">Select a repository to view its changelog.</p>
        </div>
        
        <div className="flex gap-3">
          {user && (
            <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
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
          No projects found. Click "Inject Test Project" to add one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link to={`/project/${project.id}`} key={project.id} className="block group">
               <ProjectCard project={project} onClick={() => {}} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}