import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function ProjectTimeline() {
  const { id } = useParams<{ id: string }>(); 
  const { user } = useAuth(); 
  
  const [project, setProject] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      fetchProjectAndLogs();
    }
  }, [id]);

  async function handleDelete(logId: string) {
    const isConfirmed = window.confirm("Are you sure you want to delete this changelog?");
    if (!isConfirmed) return;

    const { error } = await supabase.from('logs').delete().eq('id', logId);

    if (error) {
      alert("Error deleting log: " + error.message);
    } else {
      setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
    }
  }

  async function fetchProjectAndLogs() {
    setIsLoading(true);
    
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError.message);
      setIsLoading(false);
      return;
    }

    setProject(projectData);

    const { data: logsData, error: logsError } = await supabase
      .from('logs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (!logsError && logsData) {
      setLogs(logsData);
    }

    setIsLoading(false);
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 py-12 animate-pulse">Loading timeline...</div>;
  }

  if (!project) {
    return <div className="text-center text-red-400 py-12">Project not found.</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header Section */}
      <div className="mb-10">
        <Link to="/" className="text-gray-500 hover:text-white transition-colors text-sm mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">{project.name}</h1>
            <a 
              href={`https://github.com/${project.repo_url}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              github.com/{project.repo_url}
            </a>
          </div>
          
          {user && (
            <Link 
              to={`/project/${project.id}/write`}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              + Add Changelog
            </Link>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="space-y-8">
        {logs.length === 0 ? (
          <div className="text-center border border-dashed border-gray-800 rounded-xl py-12 px-4">
            <h3 className="text-lg font-medium text-white mb-2">No changelogs yet</h3>
            {user ? (
              <p className="text-gray-500 text-sm">Click "+ Add Changelog" above to draft your first release note.</p>
            ) : (
              <p className="text-gray-500 text-sm">The developer hasn't published any updates for this project yet. Check back soon!</p>
            )}
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="border-l-2 border-gray-800 pl-6 relative ml-3">
              <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              
              <span className="text-sm text-gray-400 font-mono block mb-2">
                {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                <span className="mx-2">•</span>
                {log.tag}
              </span>
              
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 mt-2 relative group">
                <h2 className="text-xl font-bold text-white mb-3">{log.title}</h2>
                <div className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-wrap">
                  {log.description}
                </div>

                {user && (
                  <div className="mt-6 pt-4 border-t border-gray-800/50 flex gap-4 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
                      to={`/project/${id}/edit/${log.id}`} 
                      className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1"
                    >
                      ✏️ Edit
                    </Link>
                    <button 
                      onClick={() => handleDelete(log.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}