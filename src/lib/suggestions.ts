import type { SuggestionKind, SuggestionStatus } from '../types';

// These mirror the CHECK constraints in supabase/migrations/001_suggestions_and_admin.sql
export const LIMITS = {
  titleMin: 3,
  titleMax: 120,
  bodyMax: 2000,
  nameMax: 40,
  replyMax: 2000,
} as const;

export const KINDS: SuggestionKind[] = ['bug', 'idea', 'feedback'];
export const STATUSES: SuggestionStatus[] = ['pending', 'addressed', 'implemented', 'declined'];

export const KIND_META: Record<SuggestionKind, { label: string; colorVar: string; placeholder: string }> = {
  bug: {
    label: 'bug',
    colorVar: 'var(--k-bugfix)',
    placeholder: 'What happened, what did you expect, and how can I reproduce it?',
  },
  idea: {
    label: 'idea',
    colorVar: 'var(--k-polish)',
    placeholder: 'What would you add or change, and why would it help?',
  },
  feedback: {
    label: 'feedback',
    colorVar: 'var(--k-other)',
    placeholder: 'What worked, what didn’t, what stood out?',
  },
};

export const STATUS_META: Record<SuggestionStatus, { label: string; className: string }> = {
  pending: {
    label: 'not reviewed',
    className: 'border-dashed border-line-strong text-mute',
  },
  addressed: {
    label: 'addressed',
    className: 'border-accent-text/40 bg-accent-soft/40 text-accent-text',
  },
  implemented: {
    label: 'implemented',
    className:
      'border-[var(--k-feature)]/40 bg-[color-mix(in_srgb,var(--k-feature)_14%,transparent)] text-[color-mix(in_srgb,var(--k-feature)_75%,var(--ink))]',
  },
  declined: {
    label: 'declined',
    className: 'border-line bg-sunken text-mute',
  },
};