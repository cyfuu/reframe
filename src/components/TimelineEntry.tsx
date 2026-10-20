import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Log } from '../types';
import { normalizeTag } from '../lib/tags';
import { formatDate, splitDisplayDate } from '../lib/format';

interface Props {
  log: Log;
  projectId: string;
  repoUrl: string;
  isActive: boolean;
  isAdmin: boolean;
  isCopied: boolean;
  onCopyLink: (logId: string) => void;
  onDelete: (logId: string) => void;
}

export function TimelineEntry({
  log,
  projectId,
  repoUrl,
  isActive,
  isAdmin,
  isCopied,
  onCopyLink,
  onDelete,
}: Props) {
  const { label, kind } = normalizeTag(log.tag);
  const [from, to] = splitDisplayDate(log.display_date || formatDate(log.created_at));
  const hashes =
    log.commit_hash && log.commit_hash !== 'N/A'
      ? log.commit_hash.split(',').map((h) => h.trim()).filter(Boolean)
      : [];

  return (
    <li
      id={`log-${log.id}`}
      data-timeline-entry
      style={{ '--k': `var(--k-${kind})` } as CSSProperties}
      className="group/entry relative scroll-mt-24 pb-12 pl-7 last:pb-0 md:pl-[11.5rem]"
    >
      {/* date gutter (desktop) */}
      <time className="absolute left-0 top-0 hidden w-[8.75rem] text-right font-mono text-xs leading-5 text-mute md:block">
        <span className="transition-colors group-hover/entry:text-ink">{from}</span>
        {to && <span className="block opacity-70">→ {to}</span>}
      </time>

      {/* commit node */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-[5px] size-[11px] rounded-full bg-[var(--k)] ring-4 ring-bg transition-shadow duration-200 md:left-[9.75rem] md:group-hover/entry:shadow-[0_0_0_7px_color-mix(in_srgb,var(--k)_18%,transparent)] ${
          isActive ? 'max-md:shadow-[0_0_0_7px_color-mix(in_srgb,var(--k)_22%,transparent)]' : ''
        }`}
      />

      {/* meta line */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs leading-5 text-mute">
        <span className="md:hidden">{to ? `${from} → ${to}` : from}</span>

        <span className="rounded-sm bg-[color-mix(in_srgb,var(--k)_14%,transparent)] px-1.5 py-px text-[color-mix(in_srgb,var(--k)_72%,var(--ink))]">
          {label.toLowerCase()}
        </span>

        {hashes.map((hash) => (
          <a
            key={hash}
            href={`https://github.com/${repoUrl}/commit/${hash}`}
            target="_blank"
            rel="noreferrer"
            title="View commit on GitHub"
            className="rounded border border-line px-1.5 py-px text-ink transition-colors hover:border-accent hover:bg-accent hover:text-accent-ink"
          >
            {hash.substring(0, 7)}
          </a>
        ))}
      </div>

      {/* title */}
      <div className="mt-2 flex items-start gap-2">
        <h2 className="text-lg font-semibold leading-snug tracking-tight text-ink">{log.title}</h2>
        <button
          type="button"
          onClick={() => onCopyLink(log.id)}
          aria-label="Copy link to this entry"
          title="Copy link to this entry"
          className="mt-0.5 font-mono text-sm text-mute transition-opacity hover:text-accent-text focus-visible:opacity-100 md:opacity-0 md:group-hover/entry:opacity-100"
        >
          {isCopied ? '✓' : '#'}
        </button>
      </div>

      {/* body */}
      <div className="prose prose-reframe prose-sm mt-2 max-w-none break-words">
        <ReactMarkdown
          components={{
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            ),
          }}
        >
          {log.description}
        </ReactMarkdown>
      </div>

      {isAdmin && (
        <div className="mt-4 flex gap-4 font-mono text-xs text-mute">
          <Link
            to={`/project/${projectId}/edit/${log.id}`}
            className="transition-colors hover:text-ink hover:underline hover:decoration-accent hover:decoration-2 hover:underline-offset-4"
          >
            edit
          </Link>
          <button
            type="button"
            onClick={() => onDelete(log.id)}
            className="transition-colors hover:text-[var(--k-bugfix)]"
          >
            delete
          </button>
        </div>
      )}
    </li>
  );
}