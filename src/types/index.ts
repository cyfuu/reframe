export type ProjectRole = 'owner' | 'contributor';

/** Shape used by the UI. */
export interface Project {
  id: string;
  name: string;
  repoUrl: string; // "owner/repo"
  role: ProjectRole;
  lastRelease: string | null;
  logCount: number;
}

/** Rows as they come back from Supabase. */
export interface ProjectRecord {
  id: string;
  name: string;
  repo_url: string;
  role?: ProjectRole; // absent until migration 001 has been applied
  created_at: string;
}

export interface Log {
  id: string;
  project_id: string;
  title: string;
  description: string;
  tag: string;
  commit_hash: string;
  created_at: string;
  display_date: string | null;
}

export type SuggestionKind = 'bug' | 'idea' | 'feedback';
export type SuggestionStatus = 'pending' | 'addressed' | 'implemented' | 'declined';

export interface Suggestion {
  id: string;
  project_id: string;
  log_id: string | null;
  author_id: string;
  author_name: string;
  kind: SuggestionKind;
  title: string;
  body: string;
  status: SuggestionStatus;
  admin_response: string | null;
  status_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewSuggestion {
  kind: SuggestionKind;
  title: string;
  body: string;
  authorName: string;
  /** Cloudflare Turnstile token; only needed when a visitor has no session yet. */
  captchaToken?: string;
}