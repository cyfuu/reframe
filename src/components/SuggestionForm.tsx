import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { CAPTCHA_ENABLED, CaptchaError } from '../lib/captcha';
import { KINDS, KIND_META, LIMITS } from '../lib/suggestions';
import { Turnstile } from './Turnstile';
import type { NewSuggestion, SuggestionKind } from '../types';

const LEGACY_NAME_KEY = 'reframe:author-name';

function Counter({ value, max }: { value: number; max: number }) {
  if (value < max * 0.8) return null;
  return (
    <span className={`font-mono text-xs ${value > max ? 'text-[var(--k-bugfix)]' : 'text-mute'}`}>
      {value}/{max}
    </span>
  );
}

export function SuggestionForm({ onSubmit }: { onSubmit: (input: NewSuggestion) => Promise<void> }) {
  const [kind, setKind] = useState<SuggestionKind>('idea');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_NAME_KEY);
    } catch {
      /* storage unavailable, nothing to clean */
    }
  }, []);

  // Visitors who already have a session (returning visitors, the admin) never see a check.
  const { user, isLoading: isAuthLoading } = useAuth();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [forceCaptcha, setForceCaptcha] = useState(false);
  const needsCaptcha = CAPTCHA_ENABLED && (forceCaptcha || (!isAuthLoading && !user));
  const isVerifying = needsCaptcha && !captchaToken;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const cleanName = name.trim();

    if (cleanTitle.length < LIMITS.titleMin) {
      setError(`Give it a title of at least ${LIMITS.titleMin} characters.`);
      return;
    }
    if (cleanBody.length === 0) {
      setError('Add a few details so it’s easy to act on.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        kind,
        title: cleanTitle,
        body: cleanBody,
        authorName: cleanName || 'Anonymous',
        captchaToken: needsCaptcha && captchaToken ? captchaToken : undefined,
      });
      setCaptchaToken(null);
      setForceCaptcha(false);
      setTitle('');
      setBody('');
      toast.success('Suggestion posted');
    } catch (err) {
      if (err instanceof CaptchaError) {
        // Tokens are single-use: get a fresh one by remounting the widget.
        setCaptchaToken(null);
        setCaptchaKey((k) => k + 1);
        setForceCaptcha(true);
      }
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border border-line bg-surface p-4 sm:p-5" noValidate>
      <h2 className="text-base font-semibold tracking-tight text-ink">Leave a suggestion</h2>
      <p className="mt-1 text-sm text-mute">
        Found a bug or have an idea? No account needed. Everything you post here is public.
      </p>

      <div className="mt-5">
        <span className="label" id="kind-label">Type</span>
        <div className="flex flex-wrap gap-2 font-mono text-xs" role="group" aria-labelledby="kind-label">
          {KINDS.map((option) => {
            const active = kind === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => setKind(option)}
                className={`rounded border px-2.5 py-1 transition-colors ${
                  active
                    ? 'border-ink bg-accent text-accent-ink'
                    : 'border-line text-mute hover:border-line-strong hover:text-ink'
                }`}
              >
                {KIND_META[option].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="s-title" className="label">Title</label>
          <Counter value={title.length} max={LIMITS.titleMax} />
        </div>
        <input
          id="s-title"
          type="text"
          value={title}
          maxLength={LIMITS.titleMax}
          onChange={(e) => setTitle(e.target.value)}
          className="field"
          placeholder={kind === 'bug' ? 'e.g. Timeline overlaps on small screens' : 'A short summary'}
        />
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <label htmlFor="s-body" className="label">Details</label>
          <Counter value={body.length} max={LIMITS.bodyMax} />
        </div>
        <textarea
          id="s-body"
          value={body}
          maxLength={LIMITS.bodyMax}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="field resize-y"
          placeholder={KIND_META[kind].placeholder}
        />
      </div>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-64">
          <label htmlFor="s-name" className="label">Name (optional)</label>
          <input
            id="s-name"
            type="text"
            value={name}
            maxLength={LIMITS.nameMax}
            onChange={(e) => setName(e.target.value)}
            autoComplete="nickname"
            className="field"
            placeholder="Anonymous"
          />
        </div>

        <button type="submit" disabled={isSubmitting || isVerifying} className="btn btn-primary sm:px-6">
          {isSubmitting ? 'posting…' : isVerifying ? 'verifying…' : 'post suggestion'}
        </button>
      </div>

      {needsCaptcha && (
        <div className="mt-4">
          <Turnstile key={captchaKey} onToken={setCaptchaToken} />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-[var(--k-bugfix)]/40 bg-[var(--k-bugfix)]/10 px-3 py-2 text-sm text-[var(--k-bugfix)]">
          {error}
        </p>
      )}
    </form>
  );
}