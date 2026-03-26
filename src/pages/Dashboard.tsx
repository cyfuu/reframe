import { Link } from 'react-router-dom';
import { ProjectCard } from '../components/ProjectCard';
import type { Project } from '../types';

const mockProjects: Project[] = [
  { id: 'p1', name: 'Reframe App', repoUrl: 'username/reframe', lastUpdated: 'March 26, 2026', logCount: 12 },
  { id: 'p2', name: 'Portfolio v2', repoUrl: 'username/portfolio', lastUpdated: 'March 15, 2026', logCount: 8 },
  { id: 'p3', name: 'CLI Tool', repoUrl: 'username/rust-cli', lastUpdated: 'Feb 28, 2026', logCount: 3 },
];

export function Dashboard() {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Projects</h1>
          <p className="text-gray-500">Select a repository to view its changelog.</p>
        </div>
        <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
          + New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockProjects.map(project => (
          /* The Link component handles changing the URL */
          <Link to={`/project/${project.id}`} key={project.id} className="block group">
             <ProjectCard project={project} onClick={() => {}} />
          </Link>
        ))}
      </div>
    </div>
  );
}