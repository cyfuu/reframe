import { useState, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TAGS = ['🚀 Feature', '🐛 Bugfix', '💅 UI/UX', '⚙️ Chore'];

// Fake GitHub Commits
const MOCK_COMMITS = [
  { hash: 'a1b2c3d', message: 'feat: add dark mode palette', time: '2 hours ago' },
  { hash: 'f9e8d7c', message: 'fix: resolve routing 404 on refresh', time: '5 hours ago' },
  { hash: 'b4a5d6e', message: 'chore: update npm dependencies', time: 'Yesterday' },
  { hash: 'c7f8a9b', message: 'docs: update readme with setup instructions', time: 'Yesterday' },
  { hash: 'e2d3c4b', message: 'ui: refine button hover states', time: '2 days ago' },
];

export function CurationModal({ isOpen, onClose }: Props) {
  const [selectedTag, setSelectedTag] = useState(TAGS[0]);
  const [selectedCommit, setSelectedCommit] = useState(MOCK_COMMITS[0]);
  const [titleInput, setTitleInput] = useState('');

  // Auto-fill the title input whenever a new commit is selected
  useEffect(() => {
    setTitleInput(selectedCommit.message);
  }, [selectedCommit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      
      {/* Expanded Modal Box (max-w-5xl for split screen) */}
      <div className="w-full max-w-5xl h-[85vh] bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl flex overflow-hidden">
        
        {/* LEFT COLUMN: The Commit Inbox */}
        <div className="w-1/3 min-w-[300px] border-r border-gray-800 flex flex-col bg-[#050505]">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Raw Commits</h2>
            <p className="text-xs text-gray-500 mt-1">Select a commit to reframe</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {MOCK_COMMITS.map((commit) => (
              <button
                key={commit.hash}
                onClick={() => setSelectedCommit(commit)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selectedCommit.hash === commit.hash 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-[#0a0a0a] border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                    selectedCommit.hash === commit.hash ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-900 text-gray-500'
                  }`}>
                    #{commit.hash}
                  </span>
                  <span className="text-xs text-gray-600">{commit.time}</span>
                </div>
                <p className={`text-sm truncate ${
                  selectedCommit.hash === commit.hash ? 'text-gray-200' : 'text-gray-400'
                }`}>
                  {commit.message}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: The Editor */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">Draft Release Note</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-gray-900 hover:bg-gray-800 h-8 w-8 rounded-full flex items-center justify-center">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Log Title</label>
              <input 
                type="text" 
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
            </div>

            {/* Tag Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Category</label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedTag === tag 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-600'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Markdown Description */}
            <div className="space-y-2 flex-1 flex flex-col h-full">
              <label className="text-sm font-medium text-gray-400">Description (Markdown Supported)</label>
              <textarea 
                className="w-full min-h-[250px] bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none font-mono text-sm leading-relaxed"
                placeholder="Explain what you built, why you built it, and what you learned..."
              ></textarea>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-800 bg-[#0a0a0a] flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-900 transition-colors">
              Cancel
            </button>
            <button className="bg-white text-black px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              Publish to Timeline
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}