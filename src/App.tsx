// src/App.tsx
import { useState } from 'react';
import { ChangelogCard } from './components/ChangelogCard';
import { ProjectCard } from './components/ProjectCard';
import type { Changelog, Project } from './types';

// --- MOCK DATA ---
const mockProjects: Project[] = [
  { id: 'p1', name: 'Reframe App', repoUrl: 'username/reframe', lastUpdated: 'March 26, 2026', logCount: 12 },
  { id: 'p2', name: 'Portfolio v2', repoUrl: 'username/portfolio', lastUpdated: 'March 15, 2026', logCount: 8 },
  { id: 'p3', name: 'CLI Tool', repoUrl: 'username/rust-cli', lastUpdated: 'Feb 28, 2026', logCount: 3 },
];

const mockLogs: Changelog[] = [
  { id: '1', tag: '🚀 Feature', date: 'March 26, 2026', commitHash: '#a1b2c3d', title: 'Implemented Dark Mode', description: 'Reframed the color palette to support a native dark mode.' },
  { id: '2', tag: '🐛 Bugfix', date: 'March 24, 2026', commitHash: '#f9e8d7c', title: 'Fixed routing issue', description: 'Resolved a bug where refreshing caused a 404.' }
];
// -----------------

function App() {
  // State to track if we are viewing a specific project, or the main dashboard (null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 flex flex-col items-center">
      
      {/* View 1: The Project Dashboard */}
      {!activeProjectId && (
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

          {/* Grid Layout for Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => setActiveProjectId(project.id)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* View 2: The Timeline (Shows only when a project is clicked) */}
      {activeProjectId && (
        <div className="w-full max-w-2xl flex flex-col">
          {/* Back Button */}
          <button 
            onClick={() => setActiveProjectId(null)}
            className="text-gray-500 hover:text-white self-start mb-8 text-sm flex items-center gap-2 transition-colors"
          >
            ← Back to Projects
          </button>

          <div className="mb-12">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Reframe App Changelog</h1>
            <p className="text-gray-500">A timeline of recent updates.</p>
          </div>

          {/* The Timeline we built earlier */}
          <div className="relative border-l border-gray-800 ml-3 md:ml-4 space-y-12 pb-8">
            {mockLogs.map((log) => (
              <div key={log.id} className="relative pl-8 md:pl-10">
                <span className="absolute -left-[5px] top-6 h-2.5 w-2.5 rounded-full bg-gray-600 ring-4 ring-black" />
                <ChangelogCard data={log} />
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;