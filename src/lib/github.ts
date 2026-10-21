import type { ProjectRole } from '../types';

/** The GitHub account whose repositories and contributions are listed. */
export const GITHUB_USERNAME = 'cyfuu';

export interface RepoCandidate {
  fullName: string; // "owner/repo"
  name: string;
  owner: string;
  role: ProjectRole;
  description: string | null;
  isFork: boolean;
  mergedPRs: number;
  commits: number;
}

export interface ContributedResult {
  repos: RepoCandidate[];
  /** True when one of the searches failed, so the list may be missing repositories. */
  incomplete: boolean;
}

export class GithubRateLimitError extends Error {
  resetAt: Date | null;

  constructor(resetAt: Date | null) {
    super('GitHub rate limit reached');
    this.name = 'GithubRateLimitError';
    this.resetAt = resetAt;
  }
}

/* ------------------------------ low-level fetch ----------------------------- */

async function ghFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.ok) return (await res.json()) as T;

  const rateLimited =
    (res.status === 403 || res.status === 429) &&
    (res.headers.get('x-ratelimit-remaining') === '0' || res.headers.has('retry-after'));
  if (rateLimited) {
    const reset = res.headers.get('x-ratelimit-reset');
    const retryAfter = res.headers.get('retry-after');
    const resetAt = reset
      ? new Date(Number(reset) * 1000)
      : retryAfter
        ? new Date(Date.now() + Number(retryAfter) * 1000)
        : null;
    throw new GithubRateLimitError(resetAt);
  }
  throw new Error(`GitHub responded with ${res.status}`);
}

const PER_PAGE = 100;

/** Fetches pages until one comes back short, up to maxPages. */
async function paged<TResponse, TItem>(
  makeUrl: (page: number) => string,
  getItems: (response: TResponse) => TItem[],
  maxPages: number,
): Promise<TItem[]> {
  const all: TItem[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const items = getItems(await ghFetch<TResponse>(makeUrl(page)));
    all.push(...items);
    if (items.length < PER_PAGE) break;
  }
  return all;
}

/* --------------------------------- owned repos --------------------------------- */

interface GhRepo {
  full_name: string;
  name: string;
  description: string | null;
  fork: boolean;
  owner: { login: string };
}

export async function fetchOwnedRepos(username: string): Promise<RepoCandidate[]> {
  const repos = await paged<GhRepo[], GhRepo>(
    (page) => `https://api.github.com/users/${username}/repos?per_page=${PER_PAGE}&sort=updated&page=${page}`,
    (r) => r,
    3,
  );
  return repos.map((r) => ({
    fullName: r.full_name,
    name: r.name,
    owner: r.owner.login,
    role: 'owner',
    description: r.description,
    isFork: r.fork,
    mergedPRs: 0,
    commits: 0,
  }));
}

/* ------------------------------ contributed repos ------------------------------ */

interface GhCommitSearch {
  items: { repository: GhRepo }[];
}
interface GhIssueSearch {
  items: { repository_url: string }[];
}

export async function fetchContributedRepos(username: string): Promise<ContributedResult> {
  const commitQuery = encodeURIComponent(`author:${username}`);
  const prQuery = encodeURIComponent(`author:${username} type:pr is:merged`);

  const [commitsResult, prsResult] = await Promise.allSettled([
    paged<GhCommitSearch, GhCommitSearch['items'][number]>(
      (page) =>
        `https://api.github.com/search/commits?q=${commitQuery}&sort=author-date&order=desc&per_page=${PER_PAGE}&page=${page}`,
      (r) => r.items,
      3,
    ),
    paged<GhIssueSearch, GhIssueSearch['items'][number]>(
      (page) =>
        `https://api.github.com/search/issues?q=${prQuery}&sort=updated&order=desc&per_page=${PER_PAGE}&page=${page}`,
      (r) => r.items,
      2,
    ),
  ]);

  // Both failed: surface the real reason (rate limit first, since it's actionable).
  if (commitsResult.status === 'rejected' && prsResult.status === 'rejected') {
    const limited = [commitsResult.reason, prsResult.reason].find((e) => e instanceof GithubRateLimitError);
    throw limited ?? commitsResult.reason;
  }

  const mine = username.toLowerCase();
  const byRepo = new Map<string, RepoCandidate>();

  function entry(fullName: string): RepoCandidate | null {
    const [owner, name] = fullName.split('/');
    if (!owner || !name || owner.toLowerCase() === mine) return null; // your own repos are listed separately
    const key = fullName.toLowerCase();
    let existing = byRepo.get(key);
    if (!existing) {
      existing = { fullName, name, owner, role: 'contributor', description: null, isFork: false, mergedPRs: 0, commits: 0 };
      byRepo.set(key, existing);
    }
    return existing;
  }

  if (commitsResult.status === 'fulfilled') {
    for (const { repository } of commitsResult.value) {
      const repo = entry(repository.full_name);
      if (!repo) continue;
      repo.commits += 1;
      repo.description = repo.description ?? repository.description;
      repo.isFork = repository.fork;
    }
  }

  if (prsResult.status === 'fulfilled') {
    for (const { repository_url } of prsResult.value) {
      // "https://api.github.com/repos/owner/name"
      const [owner, name] = repository_url.split('/').slice(-2);
      const repo = entry(`${owner}/${name}`);
      if (repo) repo.mergedPRs += 1;
    }
  }

  const repos = [...byRepo.values()].sort(
    (a, b) => b.commits + b.mergedPRs * 5 - (a.commits + a.mergedPRs * 5) || a.fullName.localeCompare(b.fullName),
  );
  return { repos, incomplete: commitsResult.status === 'rejected' || prsResult.status === 'rejected' };
}

/* ----------------------------------- cache ----------------------------------- */
// Unauthenticated GitHub allows only 10 searches/minute and 60 REST calls/hour per IP,
// so reopening the modal reuses results for a while instead of calling GitHub again.

const CACHE_MS = 10 * 60 * 1000;

export interface LoadedRepos {
  at: number;
  owned: Promise<RepoCandidate[]>;
  contributed: Promise<ContributedResult>;
}

let cache: LoadedRepos | null = null;

export function invalidateGithubCache() {
  cache = null;
}

export function loadGithubRepos(username: string): LoadedRepos {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache;

  const next: LoadedRepos = {
    at: Date.now(),
    owned: fetchOwnedRepos(username),
    contributed: fetchContributedRepos(username),
  };
  cache = next;

  // A failed or partial load must not be served from cache.
  const drop = () => {
    if (cache === next) cache = null;
  };
  next.owned.catch(drop);
  next.contributed.then((r) => r.incomplete && drop(), drop);
  return next;
}