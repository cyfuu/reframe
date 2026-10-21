import { useEffect, useRef, useState, type RefObject } from 'react';
import { CAPTCHA_DOMAIN, CAPTCHA_PROVIDER, CAPTCHA_SITE_KEY } from '../lib/captcha';
import { useTheme } from '../lib/theme';

/* ----------------------------- provider APIs ----------------------------- */

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  execute(widgetId: string): void;
  remove(widgetId: string): void;
  ready?(callback: () => void): void;
}

interface HcaptchaApi {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  execute(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    hcaptcha?: HcaptchaApi;
    __reframeHcaptchaReady?: () => void;
  }
}

let turnstileScript: Promise<void> | null = null;
let hcaptchaScript: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileScript) {
    turnstileScript = new Promise<void>((resolve, reject) => {
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
        turnstileScript = null; // allow a retry
        reject(new Error('Failed to load Turnstile'));
      };
      document.head.appendChild(script);
    });
  }
  return turnstileScript;
}

function loadHcaptcha(): Promise<void> {
  if (window.hcaptcha) return Promise.resolve();
  if (!hcaptchaScript) {
    hcaptchaScript = new Promise<void>((resolve, reject) => {
      window.__reframeHcaptchaReady = () => resolve();
      const script = document.createElement('script');
      // recaptchacompat=off: we don't need the reCAPTCHA-compatible globals
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off&onload=__reframeHcaptchaReady';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        hcaptchaScript = null; // allow a retry
        reject(new Error('Failed to load hCaptcha'));
      };
      document.head.appendChild(script);
    });
  }
  return hcaptchaScript;
}

/* ------------------------------- adapters -------------------------------- */

interface WidgetHandle {
  /** Run the check now (the widget is rendered but idle until this is called). */
  start(): void;
  remove(): void;
}

interface RenderArgs {
  container: HTMLElement;
  siteKey: string;
  theme: 'light' | 'dark';
  onToken(token: string): void;
  onExpire(): void;
  onError(): void;
  onDismiss(): void;
}

async function renderTurnstile(a: RenderArgs): Promise<WidgetHandle> {
  await loadTurnstile();
  const api = window.turnstile;
  if (!api) throw new Error('Turnstile unavailable');
  const id = api.render(a.container, {
    sitekey: a.siteKey,
    theme: a.theme,
    appearance: 'interaction-only',
    execution: 'execute', // wait for start() instead of running on render
    callback: a.onToken,
    'expired-callback': a.onExpire,
    'timeout-callback': a.onExpire,
    'error-callback': a.onError,
  });
  return { start: () => api.execute(id), remove: () => api.remove(id) };
}

async function renderHcaptcha(a: RenderArgs): Promise<WidgetHandle> {
  await loadHcaptcha();
  const api = window.hcaptcha;
  if (!api) throw new Error('hCaptcha unavailable');
  const id = api.render(a.container, {
    sitekey: a.siteKey,
    theme: a.theme,
    size: 'invisible', // no checkbox; a challenge only appears if hCaptcha needs one
    callback: a.onToken,
    'expired-callback': a.onExpire,
    'chalexpired-callback': a.onExpire,
    'error-callback': a.onError,
    'close-callback': a.onDismiss,
  });
  return { start: () => api.execute(id), remove: () => api.remove(id) };
}

function startOnce(handle: RefObject<WidgetHandle | null>, started: RefObject<boolean>) {
  if (started.current || !handle.current) return;
  started.current = true;
  handle.current.start();
}

/* ------------------------------- component ------------------------------- */

interface Props {
  /** Called with a fresh single-use token, or null when it expires / fails / is cleared. */
  onToken: (token: string | null) => void;
  /**
   * When true the check runs (and keeps running in the background). Pass false until the
   * visitor starts using the form, so the check isn't wasted on people who just look.
   */
  active?: boolean;
}

/**
 * CAPTCHA widget for hCaptcha or Cloudflare Turnstile (chosen by VITE_CAPTCHA_PROVIDER).
 * The script and widget are prepared as soon as it mounts, but the check itself only
 * starts when `active` becomes true. To get a new token after one has been used,
 * remount it by changing its `key`.
 */
export function Captcha({ onToken, active = true }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<WidgetHandle | null>(null);
  const startedRef = useRef(false);
  const activeRef = useRef(active);
  const onTokenRef = useRef(onToken);
  const [attempt, setAttempt] = useState(0);
  const [problem, setProblem] = useState<'failed' | 'dismissed' | null>(null);

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useEffect(() => {
    activeRef.current = active;
    if (active) startOnce(handleRef, startedRef);
  }, [active]);

  useEffect(() => {
    const siteKey = CAPTCHA_SITE_KEY;
    const container = containerRef.current;
    if (!siteKey || !container) return;

    let cancelled = false;
    startedRef.current = false;
    handleRef.current = null;

    const render = CAPTCHA_PROVIDER === 'turnstile' ? renderTurnstile : renderHcaptcha;
    render({
      container,
      siteKey,
      theme,
      onToken: (token) => {
        setProblem(null);
        onTokenRef.current(token);
      },
      // A token that expired unused can't be revived: start over with a fresh widget.
      onExpire: () => {
        onTokenRef.current(null);
        setAttempt((n) => n + 1);
      },
      onError: () => {
        setProblem('failed');
        onTokenRef.current(null);
      },
      onDismiss: () => {
        setProblem('dismissed');
        onTokenRef.current(null);
      },
    })
      .then((handle) => {
        if (cancelled) {
          handle.remove();
          return;
        }
        handleRef.current = handle;
        if (activeRef.current) startOnce(handleRef, startedRef);
      })
      .catch(() => {
        if (cancelled) return;
        setProblem('failed');
        onTokenRef.current(null);
      });

    return () => {
      cancelled = true;
      handleRef.current?.remove();
      handleRef.current = null;
      onTokenRef.current(null);
    };
  }, [theme, attempt]);

  return (
    <div>
      <div ref={containerRef} />
      {problem && (
        <div role="alert" className="mt-2 text-sm text-[var(--k-bugfix)]">
          {problem === 'failed'
            ? `The security check couldn’t load or failed. If you use a content blocker, allow ${CAPTCHA_DOMAIN}.`
            : 'The security check was closed before it finished.'}{' '}
          <button
            type="button"
            onClick={() => {
              setProblem(null);
              setAttempt((n) => n + 1);
            }}
            className="underline underline-offset-2 hover:text-ink"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}