import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { GITHUB_USERNAME, type RepoCandidate } from '../lib/github';
import { useGithubRepos } from '../hooks/useGithubRepos';
import type { Project } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProjects: Project[];
}

type Tab = 'all' | 'owner' | 'contributor';

function activityLabel(repo: RepoCandidate): string | null {
  const parts: string[] = [];
  if (repo.mergedPRs > 0) parts.push(`${repo.mergedPRs} merged PR${repo.mergedPRs === 1 ? '' : 's'}`);
  if (repo.commits > 0) parts.push(`${repo.commits} commit${repo.commits === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function NewProjectModal({ isOpen, onClose, onSuccess, existingProjects }: Props) {
  const github = useGithubRepos(isOpen);
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [includeForks, setIncludeForks] = useState(false);
  const [savingRepo, setSavingRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Everything not yet added, owned repos first (GitHub already sorted them by recent activity).
  const available = useMemo(() => {
    const added = new Set(existingProjects.map((p) => p.repoUrl.toLowerCase()));
    return [...(github.owned ?? []), ...(github.contributed ?? [])].filter(
      (repo) => !added.has(repo.fullName.toLowerCase()),
    );
  }, [existingProjects, github.owned, github.contributed]);

  const forkCount = available.filter((r) => r.isFork).length;
  const pool = includeForks ? available : available.filter((r) => !r.isFork);
  const counts = {
    all: pool.length,
    owner: pool.filter((r) => r.role === 'owner').length,
    contributor: pool.filter((r) => r.role === 'contributor').length,
  };

  const needle = query.trim().toLowerCase();
  const visible = pool.filter(
    (repo) =>
      (tab === 'all' || repo.role === tab) &&
      (needle === '' ||
        repo.fullName.toLowerCase().includes(needle) ||
        (repo.description ?? '').toLowerCase().includes(needle)),
  );

  async function handleAddProject(repo: RepoCandidate) {
    setSavingRepo(repo.fullName);
    setError(null);

    const base = { name: repo.name, repo_url: repo.fullName };
    let { error: dbError } = await supabase.from('projects').insert([{ ...base, role: repo.role }]);

    // Migration 001 adds the `role` column. If it hasn't been applied yet, still add the project.
    if (dbError && (dbError.code === 'PGRST204' || /'role' column/i.test(dbError.message))) {
      ({ error: dbError } = await supabase.from('projects').insert([base]));
      if (!dbError && repo.role === 'contributor') {
        toast('Added, but its “contributor” role wasn’t saved. Apply migration 001 to track it.', { duration: 6000 });
      }
    }

    setSavingRepo(null);
    if (dbError) {
      setError(dbError.code === '23505' ? 'That repository has already been added.' : dbError.message);
    } else {
      onSuccess();
      onClose();
    }
  }

  if (!isOpen) return null;

  const anythingLoaded = github.owned !== null || github.contributed !== null;
  const isLoadingAny = github.isLoadingOwned || github.isLoadingContributed;

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
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-md border border-line bg-bg p-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          <div>
            <h2 id="add-project-title" className="text-lg font-semibold tracking-tight text-ink">
              Add a repository
            </h2>
            <p className="mt-1 font-mono text-xs text-mute">
              public repos owned or contributed to by @{GITHUB_USERNAME}
            </p>
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

        <div className="mb-3 flex shrink-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs" role="group" aria-label="Filter by relationship">
            {(
              [
                ['all', 'all'],
                ['owner', 'owned'],
                ['contributor', 'contributed'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
                className={`rounded border px-2.5 py-1 transition-colors ${
                  tab === key
                    ? 'border-ink bg-accent text-accent-ink'
                    : 'border-line text-mute hover:border-line-strong hover:text-ink'
                }`}
              >
                {label} <span className="opacity-60">{counts[key]}</span>
              </button>
            ))}

            {forkCount > 0 && (
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-mute">
                <input
                  type="checkbox"
                  checked={includeForks}
                  onChange={(e) => setIncludeForks(e.target.checked)}
                  className="size-3.5 cursor-pointer accent-[var(--accent-text)]"
                />
                include forks ({forkCount})
              </label>
            )}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search repositories…"
            aria-label="Search repositories"
            className="field"
          />
        </div>

        {error && (
          <p role="alert" className="mb-3 shrink-0 rounded-md border border-[var(--k-bugfix)]/40 bg-[var(--k-bugfix)]/10 px-3 py-2 text-sm text-[var(--k-bugfix)]">
            {error}
          </p>
        )}

        {(github.ownedError || github.contributedError || github.incomplete) && (
          <div role="status" className="mb-3 shrink-0 rounded-md border border-line bg-sunken px-3 py-2 text-sm text-mute">
            {github.ownedError && <p>Owned repositories: {github.ownedError}</p>}
            {github.contributedError && <p>Contributed repositories: {github.contributedError}</p>}
            {github.incomplete && !github.contributedError && (
              <p>Some contributions couldn’t be loaded, so this list may be incomplete.</p>
            )}
            <button type="button" onClick={github.retry} className="mt-1 font-mono text-xs underline underline-offset-2 hover:text-ink">
              retry
            </button>
          </div>
        )}

        <div className="custom-scrollbar -mr-2 min-h-[8rem] flex-1 overflow-y-auto pr-2">
          {!anythingLoaded && isLoadingAny ? (
            <p className="py-8 text-center font-mono text-xs text-mute">fetching repositories…</p>
          ) : visible.length === 0 && !isLoadingAny ? (
            <p className="rounded-md border border-dashed border-line-strong py-8 text-center font-mono text-xs text-mute">
              {needle || tab !== 'all' ? 'no repositories match.' : 'every repository is already added.'}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-md border border-line">
              {visible.map((repo) => {
                const activity = activityLabel(repo);
                return (
                  <li key={repo.fullName} className="flex items-start justify-between gap-4 px-3 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-sm font-medium text-ink">{repo.name}</p>
                        <span
                          className={`rounded border px-1.5 py-px font-mono text-[11px] ${
                            repo.role === 'contributor'
                              ? 'border-[var(--k-feature)]/40 text-[var(--k-feature)]'
                              : 'border-line text-mute'
                          }`}
                        >
                          {repo.role === 'contributor' ? 'contributor' : 'owner'}
                        </span>
                        {repo.isFork && (
                          <span className="rounded border border-dashed border-line-strong px-1.5 py-px font-mono text-[11px] text-mute">
                            fork
                          </span>
                        )}
                      </div>
                      <p className="truncate font-mono text-xs text-mute">
                        {repo.fullName}
                        {activity && <span> · {activity}</span>}
                      </p>
                      {repo.description && <p className="mt-1 line-clamp-1 text-xs text-mute">{repo.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleAddProject(repo)}
                      disabled={savingRepo !== null}
                      className="btn btn-primary shrink-0 px-3 py-1.5"
                    >
                      {savingRepo === repo.fullName ? 'adding…' : 'add'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {anythingLoaded && isLoadingAny && (
            <p className="py-3 text-center font-mono text-xs text-mute" aria-live="polite">
              {github.isLoadingContributed ? 'looking for repositories you’ve contributed to…' : 'loading owned repositories…'}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}