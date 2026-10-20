import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { normalizeTag, TAG_OPTIONS } from '../lib/tags';
import type { Log, ProjectRecord } from '../types';

interface GithubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
}

export function WriteLog() {
  const { id, logId } = useParams<{ id: string; logId?: string }>();
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAuthLoading } = useAuth();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState<string>('Feature');
  const [content, setContent] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [commits, setCommits] = useState<GithubCommit[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [selectedCommits, setSelectedCommits] = useState<Set<string>>(new Set());
  const [attachedShas, setAttachedShas] = useState<Set<string>>(new Set());

  const isEditing = !!logId;

  useEffect(() => {
    // Wait for auth to settle first, otherwise a page refresh bounces you out.
    if (isAuthLoading) return;
    if (!isAdmin) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function fetchData() {
      const { data: projectData } = await supabase.from('projects').select('*').eq('id', id).single();
      if (cancelled || !projectData) return;

      setProject(projectData as ProjectRecord);
      setIsLoadingCommits(true);

      // Commits already attached to the entry being edited must stay selectable.
      let attached = new Set<string>();

      if (logId) {
        const { data: logData } = await supabase.from('logs').select('*').eq('id', logId).single();
        if (logData) {
          const log = logData as Log;
          setTitle(log.title);
          setTag(normalizeTag(log.tag).label);
          setContent(log.description);
          setDisplayDate(log.display_date || '');
          if (log.commit_hash && log.commit_hash !== 'N/A') {
            attached = new Set(log.commit_hash.split(','));
            setAttachedShas(attached);
          }
        }
      }

      try {
        const { data: existingLogs } = await supabase.from('logs').select('commit_hash').eq('project_id', id);
        const usedShas = new Set<string>();
        existingLogs?.forEach((log) => {
          if (log.commit_hash && log.commit_hash !== 'N/A') {
            log.commit_hash.split(',').forEach((sha: string) => usedShas.add(sha));
          }
        });

        const res = await fetch(`https://api.github.com/repos/${projectData.repo_url}/commits?per_page=50`);
        if (res.ok) {
          const commitData: GithubCommit[] = await res.json();
          if (!cancelled) {
            setCommits(commitData.filter((c) => !usedShas.has(c.sha) || attached.has(c.sha)));
          }
        }
      } catch (err) {
        console.error('Failed to fetch commits:', err);
        toast.error('Failed to fetch GitHub commits');
      } finally {
        if (!cancelled) setIsLoadingCommits(false);
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, logId, isAdmin, isAuthLoading, navigate]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const finalShas = new Set([...attachedShas, ...selectedCommits]);
    const hashedString = finalShas.size > 0 ? Array.from(finalShas).join(',') : 'N/A';

    const formatDate = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    let generatedDisplayDate = displayDate;

    if (!isEditing || selectedCommits.size > 0) {
      const selectedCommitsData = commits.filter((c) => finalShas.has(c.sha));

      if (selectedCommitsData.length > 0) {
        const dates = selectedCommitsData
          .map((c) => new Date(c.commit.author.date))
          .sort((a, b) => a.getTime() - b.getTime());

        const oldest = dates[0];
        const newest = dates[dates.length - 1];

        generatedDisplayDate =
          formatDate(oldest) === formatDate(newest)
            ? formatDate(oldest)
            : `${formatDate(oldest)} - ${formatDate(newest)}`;
      } else {
        generatedDisplayDate = formatDate(new Date());
      }
    }

    const logPayload = {
      project_id: id,
      title,
      tag,
      description: content,
      commit_hash: hashedString,
      display_date: generatedDisplayDate,
    };

    const { error } = isEditing
      ? await supabase.from('logs').update(logPayload).eq('id', logId)
      : await supabase.from('logs').insert([logPayload]);

    if (!error) {
      toast.success(isEditing ? 'Entry updated' : 'Entry published');
      navigate(`/project/${id}`);
    } else {
      console.error('Full Error:', error);
      toast.error(`Database error: ${error.message}`);
      setIsSaving(false);
    }
  }

  function toggleCommit(sha: string) {
    setSelectedCommits((prev) => {
      const next = new Set(prev);
      if (next.has(sha)) next.delete(sha);
      else next.add(sha);
      return next;
    });
  }

  function handleAppendToDraft() {
    const bulletPoints = Array.from(selectedCommits)
      .map((sha) => {
        const found = commits.find((c) => c.sha === sha);
        return found ? `- ${found.commit.message.split('\n')[0]}` : '';
      })
      .filter((msg) => msg !== '')
      .join('\n');

    setContent((prev) => prev + (prev ? '\n\n' : '') + bulletPoints);
    setAttachedShas((prev) => new Set([...prev, ...selectedCommits]));

    toast.success(`Appended ${selectedCommits.size} commit(s) to draft`);
    setSelectedCommits(new Set());
  }

  if (!project) {
    return <p className="py-12 text-center font-mono text-sm text-mute">loading workspace…</p>;
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-14rem)] w-full max-w-6xl flex-col gap-8 md:h-[calc(100dvh-14rem)] md:min-h-[34rem] md:flex-row">
      <motion.div
        className="flex min-w-0 flex-1 flex-col"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="mb-6">
          <Link to={`/project/${id}`} className="font-mono text-xs text-mute transition-colors hover:text-ink">
            ← back to timeline
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            {isEditing ? 'Edit entry' : 'New entry'}
            <span className="text-mute"> · {project.name}</span>
          </h1>
        </div>

        <form onSubmit={handlePublish} className="flex flex-1 flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="title" className="label">Title</label>
              <input
                id="title"
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="field"
                placeholder="e.g. A theme that remembers you"
              />
            </div>

            <div className="w-full sm:w-40">
              <label htmlFor="tag" className="label">Tag</label>
              <select id="tag" value={tag} onChange={(e) => setTag(e.target.value)} className="field cursor-pointer">
                {TAG_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex min-h-[18rem] flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="notes" className="label mb-0">Notes (markdown)</label>
              <div className="flex gap-1 font-mono text-xs" role="group" aria-label="Editor mode">
                {[
                  ['write', false],
                  ['preview', true],
                ].map(([text, value]) => (
                  <button
                    key={String(text)}
                    type="button"
                    aria-pressed={showPreview === value}
                    onClick={() => setShowPreview(value as boolean)}
                    className={`rounded px-2 py-0.5 transition-colors ${
                      showPreview === value ? 'bg-ink text-bg' : 'text-mute hover:text-ink'
                    }`}
                  >
                    {String(text)}
                  </button>
                ))}
              </div>
            </div>

            {showPreview ? (
              <div className="custom-scrollbar prose prose-reframe prose-sm max-w-none flex-1 overflow-y-auto rounded-md border border-line bg-surface p-4">
                {content.trim() ? <ReactMarkdown>{content}</ReactMarkdown> : <p className="text-mute">Nothing to preview yet.</p>}
              </div>
            ) : (
              <textarea
                id="notes"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="field custom-scrollbar min-h-[16rem] flex-1 resize-none p-4 font-mono text-[13px] leading-relaxed"
                placeholder="What shipped, and why?"
              />
            )}
          </div>

          <button type="submit" disabled={isSaving} className="btn btn-primary w-full py-2.5">
            {isSaving ? 'saving…' : isEditing ? 'update entry' : 'publish entry'}
          </button>
        </form>
      </motion.div>

      {/* commits sidebar */}
      <motion.aside
        className="flex min-h-[22rem] w-full shrink-0 flex-col overflow-hidden rounded-md border border-line bg-surface md:h-full md:min-h-0 md:w-80 lg:w-96"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
      >
        <div className="border-b border-line bg-sunken px-4 py-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">git log</h2>
          <p className="mt-0.5 truncate font-mono text-xs text-mute">{project.repo_url}</p>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {isLoadingCommits ? (
            <p className="py-8 text-center font-mono text-xs text-mute">loading commits…</p>
          ) : commits.length === 0 ? (
            <p className="m-3 rounded-md border border-dashed border-line-strong py-8 text-center font-mono text-xs text-mute">
              all recent commits are documented.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {commits.map((c) => {
                const isSelected = selectedCommits.has(c.sha);
                return (
                  <li key={c.sha}>
                    <button
                      type="button"
                      onClick={() => toggleCommit(c.sha)}
                      aria-pressed={isSelected}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected ? 'bg-accent/10' : 'hover:bg-sunken'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1 flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border ${
                          isSelected ? 'border-accent bg-accent text-accent-ink' : 'border-line-strong'
                        }`}
                      >
                        {isSelected && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-sm text-ink">{c.commit.message}</span>
                        <span className="mt-1 block font-mono text-xs text-mute">
                          {c.sha.substring(0, 7)} · {new Date(c.commit.author.date).toLocaleDateString()}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-line bg-sunken p-3">
          <button
            type="button"
            onClick={handleAppendToDraft}
            disabled={selectedCommits.size === 0}
            className="btn btn-primary w-full"
          >
            {selectedCommits.size === 0 ? 'select commits to append' : `append ${selectedCommits.size} to draft`}
          </button>
        </div>
      </motion.aside>
    </div>
  );
}