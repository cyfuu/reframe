/** Public Cloudflare Turnstile site key. When unset, CAPTCHA is off and the app behaves as before. */
export const TURNSTILE_SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined;

export const CAPTCHA_ENABLED = Boolean(TURNSTILE_SITE_KEY);

/** Thrown when a session can't be started because the security check is missing or failed. */
export class CaptchaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaptchaError';
  }
}

export function looksLikeCaptchaError(message: string): boolean {
  return /captcha/i.test(message);
}