import { ChangelogCard } from './components/ChangelogCard';
import type { Changelog } from './types';

const mockData: Changelog[] = [
  {
    id: '1',
    tag: '🚀 Feature',
    date: 'March 26, 2026',
    commitHash: '#a1b2c3d',
    title: 'Implemented Dark Mode & UI Overhaul',
    description: 'Completely reframed the application color palette to support a native dark mode. This update moves away from the standard bright UI into a sleeker, developer-focused aesthetic.',
  },
  {
    id: '2',
    tag: '🐛 Bugfix',
    date: 'March 24, 2026',
    commitHash: '#f9e8d7c',
    title: 'Fixed routing issue on reload',
    description: 'Resolved a bug where refreshing the page on a dynamic route would cause a 404 error. Implemented a catch-all redirect in the Vite config.',
  }
];

function App() {
  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 flex flex-col items-center">
      
      <div className="w-full max-w-2xl mb-12">
        <h1 className="text-3xl font-bold mb-2 tracking-tight">Reframe Portfolio</h1>
        <p className="text-gray-500">A timeline of recent updates.</p>
      </div>

      <div className="w-full max-w-2xl">
        {/* The Timeline Container */}
        <div className="relative border-l border-gray-800 ml-3 md:ml-4 space-y-12 pb-8">
          
          {mockData.map((log) => (
            <div key={log.id} className="relative pl-8 md:pl-10">
              
              {/* The Timeline Node (The Dot) */}
              <span className="absolute -left-[5px] top-6 h-2.5 w-2.5 rounded-full bg-gray-600 ring-4 ring-black" />
              
              <ChangelogCard data={log} />
              
            </div>
          ))}

        </div>
      </div>
      
    </div>
  );
}

export default App;