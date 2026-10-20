import { useState, type CSSProperties } from 'react';
import toast from 'react-hot-toast';
import { formatDate, timeAgo } from '../lib/format';
import { KIND_META, LIMITS, STATUSES, STATUS_META } from '../lib/suggestions';
import type { Suggestion, SuggestionStatus } from '../types';

interface Props {
  suggestion: Suggestion;
  isOwn: boolean;
  isAdmin: boolean;
  onDelete: (id: string) => Promise<void>;
  onReview: (id: string, changes: { status: SuggestionStatus; admin_response: string | null }) => Promise<void>;
}

export function SuggestionItem({ suggestion: s, isOwn, isAdmin, onDelete, onReview }: Props) {
  const [isManaging, setIsManaging] = useState(false);
  const [status, setStatus] = useState<SuggestionStatus>(s.status);
  const [response, setResponse] = useState(s.admin_response ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const kind = KIND_META[s.kind];
  const statusMeta = STATUS_META[s.status];
  const canDelete = isOwn || isAdmin;

  async function handleDelete() {
    if (!window.confirm('Delete this suggestion?')) return;
    try {
      await onDelete(s.id);
      toast.success('Suggestion deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t delete that suggestion.');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onReview(s.id, { status, admin_response: response.trim() || null });
      toast.success('Saved');
      setIsManaging(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Couldn’t save changes.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <li id={`suggestion-${s.id}`} className="scroll-mt-24 py-6 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-xs leading-5 text-mute">
        <span
          style={{ '--k': kind.colorVar } as CSSProperties}
          className="rounded-sm bg-[color-mix(in_srgb,var(--k)_14%,transparent)] px-1.5 py-px text-[color-mix(in_srgb,var(--k)_72%,var(--ink))]"
        >
          {kind.label}
        </span>

        <span className={`rounded border px-1.5 py-px ${statusMeta.className}`}>{statusMeta.label}</span>

        <span className="text-ink">{s.author_name}</span>
        {isOwn && <span className="rounded border border-line px-1.5 py-px">you</span>}
        <time dateTime={s.created_at} title={formatDate(s.created_at)}>
          {timeAgo(s.created_at)}
        </time>
      </div>

      <h3 className="mt-2 break-words text-base font-semibold leading-snug tracking-tight text-ink">{s.title}</h3>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink/90">{s.body}</p>

      {s.admin_response && (
        <div className="mt-4 border-l-2 border-accent pl-3">
          <p className="font-mono text-[11px] uppercase tracking-wider text-mute">response</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{s.admin_response}</p>
        </div>
      )}

      {(isAdmin || canDelete) && !isManaging && (
        <div className="mt-4 flex gap-4 font-mono text-xs text-mute">
          {isAdmin && (
            <button type="button" onClick={() => setIsManaging(true)} className="transition-colors hover:text-ink hover:underline hover:decoration-accent hover:decoration-2 hover:underline-offset-4">
              manage
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => void handleDelete()} className="transition-colors hover:text-[var(--k-bugfix)]">
              delete
            </button>
          )}
        </div>
      )}

      {isAdmin && isManaging && (
        <form onSubmit={handleSave} className="mt-4 space-y-4 rounded-md border border-line bg-surface p-4">
          <div className="sm:w-56">
            <label htmlFor={`status-${s.id}`} className="label">Status</label>
            <select
              id={`status-${s.id}`}
              value={status}
              onChange={(e) => setStatus(e.target.value as SuggestionStatus)}
              className="field cursor-pointer"
            >
              {STATUSES.map((option) => (
                <option key={option} value={option}>{STATUS_META[option].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={`response-${s.id}`} className="label">Public response (optional)</label>
            <textarea
              id={`response-${s.id}`}
              value={response}
              maxLength={LIMITS.replyMax}
              onChange={(e) => setResponse(e.target.value)}
              rows={3}
              className="field resize-y"
              placeholder="Shown to everyone under the suggestion"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? 'saving…' : 'save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus(s.status);
                setResponse(s.admin_response ?? '');
                setIsManaging(false);
              }}
              className="btn"
            >
              cancel
            </button>
          </div>
        </form>
      )}
    </li>
  );
}