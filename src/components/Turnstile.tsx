import { useEffect, useRef, useState } from 'react';
import { TURNSTILE_SITE_KEY } from '../lib/captcha';
import { useTheme } from '../lib/theme';

interface TurnstileOptions {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  appearance?: 'always' | 'execute' | 'interaction-only';
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  'error-callback'?: () => void;
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileOptions): string;
  remove(widgetId: string): void;
  ready?(callback: () => void): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const api = window.turnstile;
        if (api?.ready) api.ready(() => resolve());
        else resolve();
      };
      script.onerror = () => {
        scriptPromise = null; // allow a retry on the next mount
        reject(new Error('Failed to load the Turnstile script'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

interface Props {
  /** Called with a fresh single-use token, or null when it expires / fails / is cleared. */
  onToken: (token: string | null) => void;
}

/**
 * Cloudflare Turnstile widget. Mostly invisible: it only shows UI if Cloudflare wants
 * the visitor to interact. To get a new token after one has been used, remount it
 * by changing its `key`.
 */
export function Turnstile({ onToken }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    const siteKey = TURNSTILE_SITE_KEY;
    if (!siteKey) return;
    let cancelled = false;
    let widgetId: string | null = null;

    loadTurnstile()
      .then(() => {
        const container = containerRef.current;
        if (cancelled || !container || !window.turnstile) return;

        widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          theme,
          appearance: 'interaction-only',
          callback: (token) => {
            setFailed(false);
            onTokenRef.current(token);
          },
          'expired-callback': () => onTokenRef.current(null),
          'timeout-callback': () => onTokenRef.current(null),
          'error-callback': () => {
            setFailed(true);
            onTokenRef.current(null);
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        onTokenRef.current(null);
      });

    return () => {
      cancelled = true;
      if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId);
      onTokenRef.current(null);
    };
  }, [theme]);

  return (
    <div>
      <div ref={containerRef} />
      {failed && (
        <p role="alert" className="mt-2 text-sm text-[var(--k-bugfix)]">
          The security check couldn’t load. If you use a content blocker, allow challenges.cloudflare.com, then reload.
        </p>
      )}
    </div>
  );
}