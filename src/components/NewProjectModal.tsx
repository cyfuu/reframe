import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Project } from '../types';

const MY_GITHUB_USERNAME = 'cyfuu';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProjects: Project[];
}

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
}

export function NewProjectModal({ isOpen, onClose, onSuccess, existingProjects }: Props) {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [savingRepo, setSavingRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function fetchGithubRepos() {
      setIsLoadingRepos(true);
      setError(null);

      try {
        const res = await fetch(`https://api.github.com/users/${MY_GITHUB_USERNAME}/repos?sort=updated`);
        if (!res.ok) throw new Error('Failed to fetch from GitHub');

        const data: GithubRepo[] = await res.json();
        const existing = new Set(existingProjects.map((p) => p.repoUrl.toLowerCase()));

        if (!cancelled) setRepos(data.filter((repo) => !existing.has(repo.full_name.toLowerCase())));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        if (!cancelled) setIsLoadingRepos(false);
      }
    }

    void fetchGithubRepos();
    return () => {
      cancelled = true;
    };
  }, [isOpen, existingProjects]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  async function handleAddProject(repo: GithubRepo) {
    setSavingRepo(repo.full_name);
    setError(null);

    const { error: dbError } = await supabase
      .from('projects')
      .insert([{ name: repo.name, repo_url: repo.full_name }]);

    setSavingRepo(null);
    if (dbError) {
      setError(dbError.message);
    } else {
      onSuccess();
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-project-title"
        className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-md border border-line bg-bg p-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <div className="mb-5 flex shrink-0 items-start justify-between gap-4">
          <div>
            <h2 id="add-project-title" className="text-lg font-semibold tracking-tight text-ink">
              Add a repository
            </h2>
            <p className="mt-1 font-mono text-xs text-mute">public repos for @{MY_GITHUB_USERNAME}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-mute transition-colors hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <p role="alert" className="mb-4 shrink-0 rounded-md border border-[var(--k-bugfix)]/40 bg-[var(--k-bugfix)]/10 px-3 py-2 text-sm text-[var(--k-bugfix)]">
            {error}
          </p>
        )}

        <div className="custom-scrollbar -mr-2 flex-1 overflow-y-auto pr-2">
          {isLoadingRepos ? (
            <p className="py-8 text-center font-mono text-xs text-mute">fetching repositories…</p>
          ) : repos.length === 0 ? (
            <p className="rounded-md border border-dashed border-line-strong py-8 text-center font-mono text-xs text-mute">
              every public repository is already added.
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-md border border-line">
              {repos.map((repo) => (
                <li key={repo.id} className="flex items-center justify-between gap-4 px-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{repo.name}</p>
                    <p className="truncate font-mono text-xs text-mute">{repo.full_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAddProject(repo)}
                    disabled={savingRepo === repo.full_name}
                    className="btn btn-primary shrink-0 px-3 py-1.5"
                  >
                    {savingRepo === repo.full_name ? 'adding…' : 'add'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}