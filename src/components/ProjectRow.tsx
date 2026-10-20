import { Link } from 'react-router-dom';
import type { Project } from '../types';

interface Props {
  project: Project;
  isAdmin: boolean;
  onDelete: (projectId: string) => void;
}

export function ProjectRow({ project, isAdmin, onDelete }: Props) {
  return (
    <li className="group relative flex items-stretch transition-colors hover:bg-surface">
      <Link
        to={`/project/${project.id}`}
        className="grid min-w-0 flex-1 gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_6.5rem_7rem_8.5rem] sm:items-center sm:px-5"
      >
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">
            {project.name}
          </h3>
          <p className="mt-0.5 truncate font-mono text-xs text-mute">{project.repoUrl}</p>
        </div>

        <span
          className={`w-fit rounded border px-1.5 py-px font-mono text-[11px] ${
            project.role === 'contributor'
              ? 'border-[var(--k-security)]/40 text-[var(--k-security)]'
              : 'border-line text-mute'
          }`}
        >
          {project.role}
        </span>

        <span className="font-mono text-xs text-mute sm:text-right">
          {project.logCount} {project.logCount === 1 ? 'release' : 'releases'}
        </span>

        <span className="font-mono text-xs text-mute sm:text-right">
          {project.lastRelease ?? 'no releases yet'}
        </span>
      </Link>

      {isAdmin && (
        <button
          type="button"
          onClick={() => onDelete(project.id)}
          aria-label={`Delete ${project.name}`}
          title="Delete project"
          className="mr-3 self-center rounded-md border border-transparent p-2 text-mute transition-colors hover:border-[var(--k-bugfix)] hover:text-[var(--k-bugfix)]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      )}
    </li>
  );
}