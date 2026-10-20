import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/auth';
import { formatDate } from '../lib/format';
import { normalizeTag } from '../lib/tags';
import { TimelineEntry } from '../components/TimelineEntry';
import type { Log, ProjectRecord } from '../types';

const ITEMS_PER_PAGE = 10;

export function ProjectTimeline() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const location = useLocation();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (cancelled) return;
      if (projectError) {
        console.error('Error fetching project:', projectError.message);
        setIsLoading(false);
        return;
      }
      setProject(projectData as ProjectRecord);

      const { data: logsData, count, error: logsError } = await supabase
        .from('logs')
        .select('*', { count: 'exact' })
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .range(0, ITEMS_PER_PAGE - 1);

      if (cancelled) return;
      if (!logsError && logsData) {
        setLogs(logsData as Log[]);
        setTotal(count ?? logsData.length);
        setHasMore(logsData.length === ITEMS_PER_PAGE);
      }
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filteredLogs = useMemo(
    () => (selectedTag === 'All' ? logs : logs.filter((l) => normalizeTag(l.tag).label === selectedTag)),
    [logs, selectedTag],
  );

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const log of logs) {
      const { label } = normalizeTag(log.tag);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return counts;
  }, [logs]);

  const visibleKey = filteredLogs.map((l) => l.id).join(',');

  // Deep links: ?log=<id> scrolls to that entry.
  useEffect(() => {
    if (isLoading) return;
    const targetLog = new URLSearchParams(location.search).get('log');
    if (!targetLog) return;
    const element = document.getElementById(`log-${targetLog}`);
    if (!element) return;
    const timer = setTimeout(() => element.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    return () => clearTimeout(timer);
  }, [isLoading, location.search]);

  // "You are here": highlight the entry crossing the middle of the viewport.
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>('[data-timeline-entry]');
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [visibleKey]);

  async function handleDelete(logId: string) {
    if (!window.confirm('Delete this release entry?')) return;

    const toastId = toast.loading('Deleting entry…');
    const { error } = await supabase.from('logs').delete().eq('id', logId);

    if (error) {
      toast.error('Error deleting entry: ' + error.message, { id: toastId });
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      setTotal((t) => Math.max(0, t - 1));
      toast.success('Entry deleted', { id: toastId });
    }
  }

  async function loadMoreLogs() {
    setIsLoadingMore(true);
    // Offset by what's loaded: local deletes also shift the server's order, so they stay in sync.
    const from = logs.length;

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .range(from, from + ITEMS_PER_PAGE - 1);

    if (!error && data) {
      setLogs((prev) => [...prev, ...(data as Log[])]);
      setHasMore(data.length === ITEMS_PER_PAGE);
    }
    setIsLoadingMore(false);
  }

  function handleCopyLink(logId: string) {
    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    void navigator.clipboard.writeText(`${baseUrl}?log=${logId}`);
    setCopiedId(logId);
    toast.success('Link copied');
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl" aria-busy="true" aria-label="Loading timeline">
        <div className="h-8 w-56 animate-pulse rounded bg-sunken" />
        <div className="mt-3 h-4 w-40 animate-pulse rounded bg-sunken" />
        <div className="mt-12 space-y-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 md:pl-[11.5rem]">
              <div className="h-3 w-48 animate-pulse rounded bg-sunken" />
              <div className="h-5 w-72 animate-pulse rounded bg-sunken" />
              <div className="h-3 w-full max-w-md animate-pulse rounded bg-sunken" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl py-16 text-center">
        <p className="font-mono text-sm text-mute">project not found.</p>
        <Link to="/projects" className="btn mt-6">← all projects</Link>
      </div>
    );
  }

  const latest = logs[0] ? formatDate(logs[0].created_at) : null;
  const tagLabels = Array.from(tagCounts.keys());

  return (
    <div className="w-full max-w-4xl">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-mute">
          <Link to="/projects" className="transition-colors hover:text-ink">projects</Link>
          <span className="mx-1.5 opacity-50">/</span>
          <span className="text-ink">{project.name}</span>
        </nav>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-semibold tracking-tight text-ink">{project.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-mute">
              <a
                href={`https://github.com/${project.repo_url}`}
                target="_blank"
                rel="noreferrer"
                className="break-all text-accent hover:underline"
              >
                github.com/{project.repo_url}
              </a>
              <span aria-hidden="true">·</span>
              <span>
                {total} {total === 1 ? 'release' : 'releases'}
              </span>
              {latest && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>last {latest}</span>
                </>
              )}
            </div>
          </div>

          {isAdmin && (
            <Link to={`/project/${project.id}/write`} className="btn btn-primary self-start">
              + new entry
            </Link>
          )}
        </div>
      </motion.header>

      {logs.length > 0 && tagLabels.length > 1 && (
        <div className="mt-8 flex flex-wrap gap-2 font-mono text-xs" role="group" aria-label="Filter by tag">
          {['All', ...tagLabels].map((tag) => {
            const active = selectedTag === tag;
            const count = tag === 'All' ? logs.length : tagCounts.get(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedTag(tag)}
                className={`rounded border px-2.5 py-1 transition-colors ${
                  active
                    ? 'border-ink bg-ink text-bg'
                    : 'border-line text-mute hover:border-line-strong hover:text-ink'
                }`}
              >
                {tag.toLowerCase()} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-12">
        {logs.length === 0 ? (
          <div className="rounded-md border border-dashed border-line-strong px-6 py-14 text-center">
            <p className="font-mono text-sm text-ink">nothing here yet</p>
            <p className="mt-2 text-sm text-mute">
              {isAdmin
                ? 'Use “+ new entry” to write the first release note.'
                : 'No updates have been published for this project yet. Check back soon.'}
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <p className="py-12 text-center font-mono text-sm text-mute">
            no entries tagged “{selectedTag.toLowerCase()}”.
          </p>
        ) : (
          <ol className="timeline-rail list-none p-0">
            {filteredLogs.map((log) => (
              <TimelineEntry
                key={log.id}
                log={log}
                projectId={project.id}
                repoUrl={project.repo_url}
                isActive={activeId === `log-${log.id}`}
                isAdmin={isAdmin}
                isCopied={copiedId === log.id}
                onCopyLink={handleCopyLink}
                onDelete={handleDelete}
              />
            ))}

            {!hasMore && selectedTag === 'All' && (
              <li className="relative pt-12 pl-7 font-mono text-xs leading-5 text-mute md:pl-[11.5rem]">
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-[53px] size-[11px] rounded-full border-2 border-line-strong bg-bg md:left-[9.75rem]"
                />
                start of timeline
              </li>
            )}
          </ol>
        )}
      </div>

      {hasMore && logs.length > 0 && (
        <div className="mt-12 flex md:pl-[11.5rem]">
          <button type="button" onClick={() => void loadMoreLogs()} disabled={isLoadingMore} className="btn">
            {isLoadingMore ? 'loading…' : '↓ load older entries'}
          </button>
        </div>
      )}
    </div>
  );
}