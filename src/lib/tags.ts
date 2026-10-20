export type TagKind = 'feature' | 'bugfix' | 'polish' | 'security' | 'release' | 'other';

export const TAG_OPTIONS = ['Feature', 'Bugfix', 'Polish', 'Security', 'Release'] as const;

export interface NormalizedTag {
  label: string;
  kind: TagKind;
}

/**
 * Older entries were saved with a leading emoji ("🚀 Feature"). Strip anything
 * that isn't a letter or number from the front so old and new tags unify.
 */
export function normalizeTag(raw: string): NormalizedTag {
  const trimmed = raw.trim();
  const label = trimmed.replace(/^[^\p{L}\p{N}]+/u, '').trim() || trimmed;
  const key = label.toLowerCase();

  let kind: TagKind = 'other';
  if (key.includes('feat')) kind = 'feature';
  else if (key.includes('bug') || key.includes('fix')) kind = 'bugfix';
  else if (key.includes('polish')) kind = 'polish';
  else if (key.includes('secur')) kind = 'security';
  else if (key.includes('release')) kind = 'release';

  return { label, kind };
}