export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Oct 3, 2026 - Oct 5, 2026" -> ["Oct 3, 2026", "Oct 5, 2026"]; single dates -> [date, null] */
export function splitDisplayDate(value: string): [string, string | null] {
  const parts = value.split(' - ');
  if (parts.length === 2) return [parts[0], parts[1]];
  return [value, null];
}

/** "3 days ago", "yesterday", "just now" */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const diffSeconds = (new Date(iso).getTime() - now) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) return rtf.format(Math.round(diffSeconds / seconds), unit);
  }
  return 'just now';
}