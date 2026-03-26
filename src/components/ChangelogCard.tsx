import type { Changelog } from '../types';

interface Props {
  data: Changelog;
}

export function ChangelogCard({ data }: Props) {
  return (
    <div className="w-full max-w-2xl bg-[#0a0a0a] border border-gray-800 rounded-xl p-6 transition-all hover:border-gray-700">
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {data.tag}
          </span>
          <span className="text-sm text-gray-500">{data.date}</span>
        </div>
        
        <span className="text-xs text-gray-500 font-mono bg-gray-900 border border-gray-800 px-2 py-1 rounded-md transition-colors hover:text-gray-300 hover:cursor-pointer">
          {data.commitHash}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-gray-100 mb-3">
        {data.title}
      </h3>

      <div className="text-gray-400 leading-relaxed text-sm space-y-4">
        <p>{data.description}</p>
      </div>
      
    </div>
  );
}