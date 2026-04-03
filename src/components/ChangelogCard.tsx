import ReactMarkdown from 'react-markdown';
import type { Changelog } from '../types';

interface Props {
  data: Changelog;
}

export function ChangelogCard({ data }: Props) {
  return (
    <div className="w-full max-w-2xl bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6 transition-all hover:border-[var(--text-muted)]">
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {data.tag}
          </span>
          <span className="text-sm text-[var(--text-muted)]">{data.date}</span>
        </div>
        
        <span className="text-xs text-[var(--text-muted)] font-mono bg-[var(--bg-app)] border border-[var(--border-subtle)] px-2 py-1 rounded-md transition-colors hover:text-[var(--text-main)] hover:cursor-pointer">
          {data.commitHash}
        </span>
      </div>

      <h3 className="text-xl font-semibold text-[var(--text-main)] mb-3">
        {data.title}
      </h3>

      {/* The Magic Markdown Wrapper */}
      <div className="prose prose-invert prose-sm max-w-none text-[var(--text-muted)] prose-p:leading-relaxed prose-pre:bg-[var(--bg-app)] prose-pre:border prose-pre:border-[var(--border-subtle)] prose-code:text-[var(--accent)]">
        <ReactMarkdown>{data.description}</ReactMarkdown>
      </div>
      
    </div>
  );
}