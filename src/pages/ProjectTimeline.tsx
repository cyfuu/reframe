import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChangelogCard } from '../components/ChangelogCard';
import { CurationModal } from '../components/CurationModal';
import type { Changelog } from '../types';

const mockLogs: Changelog[] = [
  { 
    id: '1', 
    tag: '🚀 Feature', 
    date: 'March 26, 2026', 
    commitHash: '#a1b2c3d', 
    title: 'Implemented Dark Mode', 
    description: 'Reframed the color palette to support a native dark mode. This required overhauling our entire CSS variable structure.\n\n### What changed:\n* Removed all `bg-white` hardcoded values.\n* Implemented the `@tailwindcss/typography` plugin.\n\n```javascript\n// The new theme config\nexport const theme = "dark";\nconsole.log("Dark mode active!");\n```' 
  },
  { id: '2', tag: '🐛 Bugfix', date: 'March 24, 2026', commitHash: '#f9e8d7c', title: 'Fixed routing issue', description: 'Resolved a bug where refreshing caused a 404.' }
];

export function ProjectTimeline() {
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="w-full max-w-2xl flex flex-col">
      <Link 
        to="/"
        className="text-gray-500 hover:text-white self-start mb-8 text-sm flex items-center gap-2 transition-colors"
      >
        ← Back to Projects
      </Link>

      {/* Header */}
      <div className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Project {id} Changelog</h1>
          <p className="text-gray-500">A timeline of recent updates.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600/10 text-blue-400 border border-blue-600/30 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600/20 transition-colors"
        >
          + Draft Log
        </button>
      </div>

      {/* Timeline */}
      <div className="relative border-l border-gray-800 ml-3 md:ml-4 space-y-12 pb-8">
        {mockLogs.map((log) => (
          <div key={log.id} className="relative pl-8 md:pl-10">
            <span className="absolute -left-[5px] top-6 h-2.5 w-2.5 rounded-full bg-gray-600 ring-4 ring-black" />
            <ChangelogCard data={log} />
          </div>
        ))}
      </div>

      {/* Render the Modal */}
      <CurationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

    </div>
  );
}