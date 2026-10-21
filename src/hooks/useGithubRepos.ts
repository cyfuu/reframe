import { useCallback, useEffect, useState } from 'react';
import {
  GITHUB_USERNAME,
  GithubRateLimitError,
  invalidateGithubCache,
  loadGithubRepos,
  type RepoCandidate,
} from '../lib/github';

function describeError(error: unknown): string {
  if (error instanceof GithubRateLimitError) {
    const when = error.resetAt
      ? ` Try again after ${error.resetAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      : ' Try again in a few minutes.';
    return `GitHub’s rate limit was reached.${when}`;
  }
  return 'Couldn’t reach GitHub.';
}

/** Loads owned and contributed repositories independently, so one failing doesn't hide the other. */
export function useGithubRepos(enabled: boolean) {
  const [owned, setOwned] = useState<RepoCandidate[] | null>(null);
  const [contributed, setContributed] = useState<RepoCandidate[] | null>(null);
  const [ownedError, setOwnedError] = useState<string | null>(null);
  const [contributedError, setContributedError] = useState<string | null>(null);
  const [incomplete, setIncomplete] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const loaded = loadGithubRepos(GITHUB_USERNAME);

    loaded.owned.then(
      (repos) => {
        if (cancelled) return;
        setOwned(repos);
        setOwnedError(null);
      },
      (error) => {
        if (!cancelled) setOwnedError(describeError(error));
      },
    );

    loaded.contributed.then(
      (result) => {
        if (cancelled) return;
        setContributed(result.repos);
        setIncomplete(result.incomplete);
        setContributedError(null);
      },
      (error) => {
        if (!cancelled) setContributedError(describeError(error));
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled, attempt]);

  const retry = useCallback(() => {
    invalidateGithubCache();
    setOwned(null);
    setContributed(null);
    setOwnedError(null);
    setContributedError(null);
    setIncomplete(false);
    setAttempt((n) => n + 1);
  }, []);

  return {
    owned,
    contributed,
    ownedError,
    contributedError,
    incomplete,
    isLoadingOwned: owned === null && ownedError === null,
    isLoadingContributed: contributed === null && contributedError === null,
    retry,
  };
}