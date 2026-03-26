import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
}

export function WriteLog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [version, setVersion] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
  const [attachedShas, setAttachedShas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    async function fetchProjectAndCommits() {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
        
      if (projectData) {
        setProject(projectData);
        setIsLoadingCommits(true);
        
        try {
          const { data: existingLogs } = await supabase
            .from('logs')
            .select('commit_hash')
            .eq('project_id', id);

          const usedShas = new Set<string>();
          if (existingLogs) {
            existingLogs.forEach(log => {
              if (log.commit_hash && log.commit_hash !== 'N/A') {
                log.commit_hash.split(',').forEach((sha: string) => usedShas.add(sha));
              }
            });
          }

          const res = await fetch(`https://api.github.com/repos/${projectData.repo_url}/commits`);
          if (res.ok) {
            const commitData: GithubCommit[] = await res.json();
            
            const freshCommits = commitData.filter(c => !usedShas.has(c.sha));
            setCommits(freshCommits);
          }
        } catch (error) {
          console.error("Failed to fetch commits:", error);
        } finally {
          setIsLoadingCommits(false);
        }
      }
    }
    
    fetchProjectAndCommits();
  }, [id, user, navigate]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const finalShas = new Set([...attachedShas, ...selectedCommits]);
    
    const hashedString = finalShas.size > 0 
      ? Array.from(finalShas).join(',') 
      : 'N/A';

    const { error } = await supabase.from('logs').insert([{
      project_id: id,
      title: title,
      tag: version,
      description: content,
      commit_hash: hashedString,
    }]);

    if (!error) {
      navigate(`/project/${id}`);
    } else {
      console.error(error);
      setIsSaving(false);
    }
  }

  function toggleCommit(sha: string) {
    const newSelection = new Set(selectedCommits);
    if (newSelection.has(sha)) newSelection.delete(sha);
    else newSelection.add(sha);
    setSelectedCommits(newSelection);
  }

  function handleAppendToDraft() {
    const bulletPoints = Array.from(selectedCommits)
      .map(sha => {
        const found = commits.find(c => c.sha === sha);
        return found ? `- ${found.commit.message.split('\n')[0]}` : '';
      })
      .filter(msg => msg !== '')
      .join('\n');

    setContent(prev => prev + (prev ? '\n\n' : '') + bulletPoints);
    
    const newAttached = new Set(attachedShas);
    selectedCommits.forEach(sha => newAttached.add(sha));
    setAttachedShas(newAttached);

    setSelectedCommits(new Set());
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

          <div className="flex-1 flex flex-col relative">
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
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {isLoadingCommits ? (
            <div className="text-center text-gray-500 py-8 animate-pulse text-sm">Loading commits...</div>
          ) : commits.length === 0 ? (
            <div className="text-center text-gray-500 py-8 text-sm border border-dashed border-gray-800 m-2 rounded-xl">
              All recent commits have been documented!
            </div>
          ) : (
            commits.map((c) => {
              const isSelected = selectedCommits.has(c.sha);
              return (
                <div 
                  key={c.sha}
                  onClick={() => toggleCommit(c.sha)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-500/10 border-blue-500/50' 
                      : 'bg-[#050505] border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <p className={`text-sm mb-1 line-clamp-2 ${isSelected ? 'text-blue-100' : 'text-gray-300'}`}>
                    {c.commit.message}
                  </p>
                  <p className="text-xs text-gray-600 font-mono">
                    {new Date(c.commit.author.date).toLocaleDateString()} • {c.sha.substring(0, 7)}
                  </p>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#050505]">
          <button
            onClick={handleAppendToDraft}
            disabled={selectedCommits.size === 0}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedCommits.size === 0 
              ? 'Select commits to append' 
              : `Append ${selectedCommits.size} to Draft`}
          </button>
        </div>
      </div>

    </div>
  );
}