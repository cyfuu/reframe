/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Public CAPTCHA site key. Leave unset to disable CAPTCHA. */
  readonly VITE_CAPTCHA_SITE_KEY?: string;
  /** 'hcaptcha' (default) or 'turnstile'. Must match the provider enabled in Supabase. */
  readonly VITE_CAPTCHA_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}