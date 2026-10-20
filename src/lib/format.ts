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