import type { Project } from '../types';

interface Props {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: Props) {
  return (
    <div 
      onClick={onClick}
      className="group w-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 
                 transition-all duration-500 ease-[0.25,1,0.5,1] hover:cursor-pointer flex flex-col justify-between min-h-[170px] 
                 shadow-sm hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] [data-theme=light]:hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.05)]
                 hover:scale-[1.01] hover:border-[var(--accent)]/30 backdrop-blur-sm"
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors duration-500 ease-[0.25,1,0.5,1]">
            {project.name}
          </h3>
          <span className="text-[11px] font-medium bg-[var(--bg-app)] text-[var(--text-muted)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] transition-colors duration-500">
            {project.logCount} Logs
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)] font-mono mt-1 break-all opacity-80">
          {project.repoUrl}
        </p>
      </div>

      <div className="text-xs text-[var(--text-muted)] mt-6 opacity-60 font-medium transition-opacity duration-500 ease-[0.25,1,0.5,1] group-hover:opacity-100">
        Last updated: {project.lastUpdated}
      </div>
    </div>
  );
}