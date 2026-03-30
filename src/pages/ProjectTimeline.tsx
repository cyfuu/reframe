import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function ProjectTimeline() {
  const { id } = useParams<{ id: string }>(); 
  const { user } = useAuth(); 
  const location = useLocation();
  
  const [project, setProject] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectAndLogs();
    }
  }, [id]);

  useEffect(() => {
    if (!isLoading) {
      const params = new URLSearchParams(location.search);
      const targetLog = params.get('log');
      
      if (targetLog) {
        const element = document.getElementById(`log-${targetLog}`);
        if (element) {
          setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
      }
    }
  }, [isLoading, location.search]);

  async function handleDelete(logId: string) {
    const isConfirmed = window.confirm("Are you sure you want to delete this changelog?");
    if (!isConfirmed) return;

    const toastId = toast.loading('Deleting changelog...');
    const { error } = await supabase.from('logs').delete().eq('id', logId);

    if (error) {
      toast.error("Error deleting log: " + error.message, { id: toastId });
    } else {
      setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
      toast.success('Changelog deleted successfully', { id: toastId });
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
      .order('created_at', { ascending: false })
      .range(0, ITEMS_PER_PAGE - 1);

    if (!logsError && logsData) {
      setLogs(logsData);
      setHasMore(logsData.length === ITEMS_PER_PAGE); 
    }
    setIsLoading(false);
  }

  async function loadMoreLogs() {
    setIsLoadingMore(true);
    const nextPage = page + 1;
    
    const from = nextPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setLogs(prevLogs => [...prevLogs, ...data]);
      setHasMore(data.length === ITEMS_PER_PAGE);
      setPage(nextPage);
    }
    setIsLoadingMore(false);
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 py-12 animate-pulse">Loading timeline...</div>;
  }

  if (!project) {
    return <div className="text-center text-red-400 py-12">Project not found.</div>;
  }

  const uniqueTags = ['All', ...Array.from(new Set(logs.map(log => log.tag)))];

  const filteredLogs = selectedTag === 'All' ? logs : logs.filter(log => log.tag === selectedTag);

  function handleCopyLink(logId: string) {
    const baseUrl = window.location.href.split('?')[0]; 
    const url = `${baseUrl}?log=${logId}`;
    
    navigator.clipboard.writeText(url);
    setCopiedId(logId);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header Section */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Link to="/projects" className="text-gray-500 hover:text-white transition-colors text-sm mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold mb-2 text-white break-words">{project.name}</h1>
          <a 
            href={`https://github.com/${project.repo_url}`} 
            target="_blank" 
            rel="noreferrer"
            className="text-blue-400 hover:underline text-sm break-all"
          >
            github.com/{project.repo_url}
          </a>
        </div>
        
        {user && (
          <div className="w-full sm:w-auto mt-2 sm:mt-0">
            <Link 
              to={`/project/${project.id}/write`}
              className="block w-full sm:w-auto text-center bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              + Add Changelog
            </Link>
          </div>
        )}
      </motion.div>

      {logs.length > 0 && (
        <motion.div 
          className="flex flex-wrap gap-2 mt-6 sm:mt-0 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {uniqueTags.map((tag, index) => (
            <motion.button
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedTag === tag 
                  ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.2)]' 
                  : 'bg-[#0a0a0a] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-600'
              }`}
            >
              {tag}
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Timeline Section */}
      <div>
        {logs.length === 0 ? (
          <div className="text-center border border-dashed border-gray-800 rounded-xl py-12 px-4">
            <h3 className="text-lg font-medium text-white mb-2">No changelogs yet</h3>
            {user ? (
              <p className="text-gray-500 text-sm">Click "+ Add Changelog" above to draft your first release note.</p>
            ) : (
              <p className="text-gray-500 text-sm">The developer hasn't published any updates for this project yet. Check back soon!</p>
            )}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No changelogs found for "{selectedTag}".
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div 
              key={log.id} 
              id={`log-${log.id}`} 
              className="border-l-2 border-gray-800 pl-6 relative ml-3 group pb-8 last:pb-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="absolute w-3 h-3 bg-gray-600 rounded-full -left-[7px] top-1.5 shadow-none transition-all duration-300 ease-out group-hover:scale-150 group-hover:bg-white group-hover:shadow-[0_0_20px_rgba(255,255,255,0.8)]"></div>
              
              <div className="text-sm text-gray-400 font-mono mb-3 flex flex-wrap items-center gap-y-2">
                <span className="whitespace-nowrap">
                  {log.display_date || new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                
                <span className="mx-2 text-gray-600">•</span>
                <span className="whitespace-nowrap">{log.tag}</span>
                
                {log.commit_hash && log.commit_hash !== 'N/A' && log.commit_hash.split(',').map((hash: string) => (
                  <span key={hash} className="flex items-center whitespace-nowrap">
                    <span className="mx-2 text-gray-600">•</span>
                    <a 
                      href={`https://github.com/${project.repo_url}/commit/${hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs transition-colors"
                      title="View commit on GitHub"
                    >
                      {hash.substring(0, 7)}
                    </a>
                  </span>
                ))}
              </div>
              
              <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 mt-2 relative group transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:border-gray-600 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-xl font-bold text-white">{log.title}</h2>
                  <button 
                    onClick={() => handleCopyLink(log.id)}
                    className="text-gray-600 hover:text-gray-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Copy direct link to this update"
                  >
                    {copiedId === log.id ? '✅' : '🔗'}
                  </button>
                </div>
                <div className="prose prose-invert max-w-none text-gray-300 text-sm whitespace-pre-wrap break-words">
                  {log.description}
                </div>

                {user && (
                  <div className="mt-6 pt-4 border-t border-gray-800/50 flex gap-4 text-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
            </motion.div>
          ))
        )}
      </div>
      
      {/* Load More Button */}
      {hasMore && logs.length > 0 && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={loadMoreLogs}
            disabled={isLoadingMore}
            className="px-6 py-2 bg-[#0a0a0a] border border-gray-800 text-white rounded-full text-sm font-medium hover:bg-gray-800 hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? 'Loading...' : 'Load More Updates'}
          </button>
        </div>
      )}
    </div>
  );
}