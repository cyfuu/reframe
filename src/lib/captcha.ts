export type CaptchaProvider = 'hcaptcha' | 'turnstile';

const siteKey: string | undefined = import.meta.env.VITE_CAPTCHA_SITE_KEY || undefined;
const legacyTurnstileKey: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY || undefined;

/** Public site key. Leave unset to turn CAPTCHA off entirely. */
export const CAPTCHA_SITE_KEY: string | undefined = siteKey ?? legacyTurnstileKey;

/**
 * Must match the provider enabled in Supabase (Auth > Attack Protection).
 * The older VITE_TURNSTILE_SITE_KEY variable keeps working and implies Turnstile.
 */
export const CAPTCHA_PROVIDER: CaptchaProvider = siteKey
  ? import.meta.env.VITE_CAPTCHA_PROVIDER === 'turnstile'
    ? 'turnstile'
    : 'hcaptcha'
  : 'turnstile';

export const CAPTCHA_ENABLED = Boolean(CAPTCHA_SITE_KEY);

/** Domain to allow if a content blocker is stopping the check from loading. */
export const CAPTCHA_DOMAIN = CAPTCHA_PROVIDER === 'turnstile' ? 'challenges.cloudflare.com' : 'hcaptcha.com';

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