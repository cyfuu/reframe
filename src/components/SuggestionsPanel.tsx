import { useMemo, useState } from 'react';
import { STATUSES, STATUS_META } from '../lib/suggestions';
import type { NewSuggestion, Suggestion, SuggestionStatus } from '../types';
import { SuggestionForm } from './SuggestionForm';
import { SuggestionItem } from './SuggestionItem';

interface Props {
  suggestions: Suggestion[];
  isLoading: boolean;
  loadError: string | null;
  currentUserId: string | null;
  isAdmin: boolean;
  onCreate: (input: NewSuggestion) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReview: (id: string, changes: { status: SuggestionStatus; admin_response: string | null }) => Promise<void>;
}

export function SuggestionsPanel({
  suggestions,
  isLoading,
  loadError,
  currentUserId,
  isAdmin,
  onCreate,
  onDelete,
  onReview,
}: Props) {
  const [filter, setFilter] = useState<SuggestionStatus | 'all'>('all');

  const counts = useMemo(() => {
    const result: Record<SuggestionStatus, number> = { pending: 0, addressed: 0, implemented: 0, declined: 0 };
    for (const s of suggestions) result[s.status] += 1;
    return result;
  }, [suggestions]);

  const visible = filter === 'all' ? suggestions : suggestions.filter((s) => s.status === filter);

  if (loadError) {
    return (
      <div className="rounded-md border border-dashed border-line-strong px-6 py-14 text-center">
        <p className="font-mono text-sm text-ink">suggestions aren’t available right now</p>
        <p className="mt-2 text-sm text-mute">Please check back in a little while.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <SuggestionForm onSubmit={onCreate} />

      <div className="mt-12">
        {suggestions.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 font-mono text-xs" role="group" aria-label="Filter by status">
            {(['all', ...STATUSES] as const).map((option) => {
              const active = filter === option;
              const count = option === 'all' ? suggestions.length : counts[option];
              if (option !== 'all' && count === 0 && !active) return null;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option)}
                  className={`rounded border px-2.5 py-1 transition-colors ${
                    active
                      ? 'border-ink bg-accent text-accent-ink'
                      : 'border-line text-mute hover:border-line-strong hover:text-ink'
                  }`}
                >
                  {option === 'all' ? 'all' : STATUS_META[option].label} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Loading suggestions">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-48 animate-pulse rounded bg-sunken" />
                <div className="h-5 w-64 animate-pulse rounded bg-sunken" />
                <div className="h-3 w-full max-w-md animate-pulse rounded bg-sunken" />
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-md border border-dashed border-line-strong px-6 py-12 text-center">
            <p className="font-mono text-sm text-ink">no suggestions yet</p>
            <p className="mt-2 text-sm text-mute">Be the first. Bugs, ideas and feedback are all welcome.</p>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-8 text-center font-mono text-sm text-mute">nothing with that status.</p>
        ) : (
          <ul className="list-none divide-y divide-line p-0">
            {visible.map((s) => (
              <SuggestionItem
                key={s.id}
                suggestion={s}
                isOwn={currentUserId !== null && s.author_id === currentUserId}
                isAdmin={isAdmin}
                onDelete={onDelete}
                onReview={onReview}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}