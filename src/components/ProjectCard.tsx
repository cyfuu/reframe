// src/components/ProjectCard.tsx
import type { Project } from '../types';

interface Props {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: Props) {
  return (
    <div 
      onClick={onClick}
      className="group w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 transition-all hover:border-gray-600 hover:cursor-pointer flex flex-col justify-between min-h-[160px]"
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors">
            {project.name}
          </h3>
          <span className="text-xs font-medium bg-gray-900 text-gray-400 px-2.5 py-1 rounded-full border border-gray-800">
            {project.logCount} Logs
          </span>
        </div>
        <p className="text-sm text-gray-500 font-mono mt-1">
          {project.repoUrl}
        </p>
      </div>

      <div className="text-xs text-gray-600 mt-6">
        Last updated: {project.lastUpdated}
      </div>
    </div>
  );
}