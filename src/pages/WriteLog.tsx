import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function WriteLog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    async function fetchProject() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (data) setProject(data);
    }
    
    fetchProject();
  }, [id, user, navigate]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase.from('logs').insert([{
      project_id: id,
      title,
      version,
      content,
      date: new Date().toISOString(),
    }]);

    if (!error) {
      navigate(`/project/${id}`);
    } else {
      console.error(error);
      setIsSaving(false);
    }
  }

  if (!project) {
    return <div className="text-center text-gray-500 py-12 animate-pulse">Loading workspace...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 h-[75vh]">
      
      {/* LEFT SIDE: The Text Editor */}
      <div className="flex-1 flex flex-col h-full">
        <div className="mb-6">
          <Link to={`/project/${id}`} className="text-gray-500 hover:text-white transition-colors text-sm mb-2 inline-block">
            ← Back to Timeline
          </Link>
          <h1 className="text-2xl font-bold text-white">Drafting release for {project.name}</h1>
        </div>

        <form onSubmit={handlePublish} className="flex-1 flex flex-col gap-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Update Title</label>
              <input
                required
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
                placeholder="e.g. Added secure authentication"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-400 mb-1">Version</label>
              <input
                required
                type="text"
                value={version}
                onChange={e => setVersion(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all"
                placeholder="v1.0.0"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-400 mb-1">Changelog Notes</label>
            <textarea
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full flex-1 bg-[#0a0a0a] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all resize-none font-mono text-sm leading-relaxed custom-scrollbar"
              placeholder="Summarize your updates here..."
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 mt-2"
          >
            {isSaving ? 'Publishing...' : 'Publish Changelog'}
          </button>
        </form>
      </div>

      {/* RIGHT SIDE: GitHub Assistant Shell */}
      <div className="w-full md:w-80 lg:w-96 bg-[#0a0a0a] border border-gray-800 rounded-xl flex flex-col overflow-hidden h-full shrink-0">
        <div className="p-4 border-b border-gray-800 bg-[#050505]">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">GitHub Commits</h2>
          <p className="text-xs text-gray-500 truncate">{project.repo_url}</p>
        </div>
        
        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-gray-800/50 m-4 rounded-xl">
          <p className="text-sm">We will wire up the GitHub API here next!</p>
        </div>
      </div>

    </div>
  );
}