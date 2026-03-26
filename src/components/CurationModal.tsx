import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TAGS = ['🚀 Feature', '🐛 Bugfix', '💅 UI/UX', '⚙️ Chore'];

export function CurationModal({ isOpen, onClose }: Props) {
  const [selectedTag, setSelectedTag] = useState(TAGS[0]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      
      {/* The Modal Box */}
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Draft Release Note</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
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
              placeholder="e.g., Implemented Dark Mode" 
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Description (Markdown Supported)</label>
            <textarea 
              rows={6}
              placeholder="Explain what you built, why you built it, and what you learned..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            ></textarea>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 bg-[#0a0a0a] rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
            Publish to Timeline
          </button>
        </div>

      </div>
    </div>
  );
}