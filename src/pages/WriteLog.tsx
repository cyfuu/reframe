import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string; };
  };
}

export function WriteLog() {
  const { id, logId } = useParams<{ id: string; logId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('🚀 Feature');
  const [content, setContent] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
  const [attachedShas, setAttachedShas] = useState<Set<string>>(new Set());

  const isEditing = !!logId;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    async function fetchData() {
      const { data: projectData } = await supabase.from('projects').select('*').eq('id', id).single();
        
      if (projectData) {
        setProject(projectData);
        setIsLoadingCommits(true);
        
        if (isEditing) {
          const { data: logData } = await supabase.from('logs').select('*').eq('id', logId).single();
          if (logData) {
            setTitle(logData.title);
            setTag(logData.tag);
            setContent(logData.description);
            setDisplayDate(logData.display_date || '');
            if (logData.commit_hash && logData.commit_hash !== 'N/A') {
              setAttachedShas(new Set(logData.commit_hash.split(',')));
            }
          }
        }
        
        try {
          const { data: existingLogs } = await supabase.from('logs').select('commit_hash').eq('project_id', id);
          const usedShas = new Set<string>();
          if (existingLogs) {
            existingLogs.forEach(log => {
              if (log.commit_hash && log.commit_hash !== 'N/A') {
                log.commit_hash.split(',').forEach((sha: string) => usedShas.add(sha));
              }
            });
          }

          const res = await fetch(`https://api.github.com/repos/${projectData.repo_url}/commits?per_page=50`);
          if (res.ok) {
            const commitData: GithubCommit[] = await res.json();
            const freshCommits = commitData.filter(c => !usedShas.has(c.sha) || attachedShas.has(c.sha));
            setCommits(freshCommits);
          }
        } catch (error) {
          console.error("Failed to fetch commits:", error);
          toast.error("Failed to fetch GitHub commits");
        } finally {
          setIsLoadingCommits(false);
        }
      }
    }
    
    fetchData();
  }, [id, logId, user, navigate, isEditing]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    
    const finalShas = new Set([...attachedShas, ...selectedCommits]);
    const hashedString = finalShas.size > 0 ? Array.from(finalShas).join(',') : 'N/A';

    const formatDate = (dateObj: Date) => 
      dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let generatedDisplayDate = displayDate;
    
    if (!isEditing || selectedCommits.size > 0) {
      const selectedCommitsData = commits.filter(c => finalShas.has(c.sha));

      if (selectedCommitsData.length > 0) {
        const dates = selectedCommitsData.map(c => new Date(c.commit.author.date));
        dates.sort((a, b) => a.getTime() - b.getTime());

        const oldest = dates[0];
        const newest = dates[dates.length - 1];

        generatedDisplayDate = formatDate(oldest) === formatDate(newest)
          ? formatDate(oldest)
          : `${formatDate(oldest)} - ${formatDate(newest)}`;
      } else {
        generatedDisplayDate = formatDate(new Date());
      }
    }

    const logPayload = {
      project_id: id,
      title: title,
      tag: tag,
      description: content,
      commit_hash: hashedString,
      display_date: generatedDisplayDate, 
    };

    let error;

    if (isEditing) {
      const { error: updateError } = await supabase.from('logs').update(logPayload).eq('id', logId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('logs').insert([logPayload]);
      error = insertError;
    }

    if (!error) {
      toast.success(isEditing ? 'Changelog updated successfully!' : 'Changelog published!');
      navigate(`/project/${id}`);
    } else {
      console.error("Full Error:", error);
      toast.error(`Database Error: ${error.message}`);
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

    toast.success(`Appended ${selectedCommits.size} commit(s) to draft`);
    setSelectedCommits(new Set());
  }

  if (!project) return <div className="text-center text-[var(--text-muted)] py-12 animate-pulse">Loading workspace...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 min-h-[calc(100vh-8rem)] md:min-h-0 md:h-[80vh]">
      <motion.div 
        className="flex-1 flex flex-col h-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <Link to={`/project/${id}`} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-sm mb-2 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Timeline
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">
            {isEditing ? 'Editing release for' : 'Drafting release for'} {project.name}
          </h1>
        </div>

        <form onSubmit={handlePublish} className="flex-1 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Title</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} 
                className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg px-4 py-2.5 text-[var(--text-main)] focus:border-[var(--accent)] transition-all outline-none" 
                placeholder='e.g., Shipped the new dark theme 🌙'
              />
            </div>
            
            <div className="w-full sm:w-40">
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Tag</label>
              <div className="relative">
                <select value={tag} onChange={e => setTag(e.target.value)} className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg pl-3 pr-10 py-2.5 text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] transition-all appearance-none cursor-pointer">
                  <option value="🚀 Feature">🚀 Feature</option>
                  <option value="🐛 Bugfix">🐛 Bugfix</option>
                  <option value="✨ Polish">✨ Polish</option>
                  <option value="🔒 Security">🔒 Security</option>
                  <option value="📦 Release">📦 Release</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--text-muted)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative">
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Changelog Notes</label>
            <textarea required value={content} onChange={e => setContent(e.target.value)} 
              className="w-full bg-[var(--surface)]/50 border border-[var(--border-subtle)] rounded-lg p-4 text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none min-h-[300px] flex-1 md:flex-none"
              placeholder="What did you build today?"
            />
          </div>

          <button type="submit" disabled={isSaving} className="w-full bg-[var(--text-main)] text-[var(--bg-app)] px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 mt-2">
            {isSaving ? 'Saving...' : isEditing ? 'Update Changelog' : 'Publish Changelog'}
          </button>
        </form>
      </motion.div>

      {/* GitHub Assistant Sidebar */}
      <motion.div 
        className="w-full md:w-80 lg:w-96 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl flex flex-col overflow-hidden shrink-0 min-h-[400px] md:min-h-0 md:h-full"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-app)]/50">
          <h2 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">GitHub Commits</h2>
          <p className="text-xs text-[var(--text-muted)] truncate">{project.repo_url}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {isLoadingCommits ? (
            <div className="text-center text-[var(--text-muted)] py-8 animate-pulse text-sm">Loading commits...</div>
          ) : commits.length === 0 ? (
            <div className="text-center text-[var(--text-muted)] py-8 text-sm border border-dashed border-[var(--border-subtle)] m-2 rounded-xl">All recent commits documented!</div>
          ) : (
            commits.map((c) => {
              const isSelected = selectedCommits.has(c.sha);
              return (
                <div key={c.sha} onClick={() => toggleCommit(c.sha)} className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--bg-app)]/30 border-[var(--border-subtle)] hover:border-[var(--text-muted)]'}`}>
                  <p className={`text-sm mb-1 line-clamp-2 ${isSelected ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{c.commit.message}</p>
                  <p className="text-xs opacity-50 font-mono">{new Date(c.commit.author.date).toLocaleDateString()} • {c.sha.substring(0, 7)}</p>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-app)]/50">
          <button onClick={handleAppendToDraft} disabled={selectedCommits.size === 0} className="w-full bg-[var(--accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            {selectedCommits.size === 0 ? 'Select commits to append' : `Append ${selectedCommits.size} to Draft`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}