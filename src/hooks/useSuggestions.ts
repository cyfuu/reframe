import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CAPTCHA_ENABLED, CaptchaError, looksLikeCaptchaError } from '../lib/captcha';
import type { NewSuggestion, Suggestion, SuggestionStatus } from '../types';

/** Make sure there is a session to post with. Visitors get a silent anonymous one. */
async function ensureSession(captchaToken?: string): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return;

  if (CAPTCHA_ENABLED && !captchaToken) {
    throw new CaptchaError('Please complete the security check, then post again.');
  }

  const { error } = await supabase.auth.signInAnonymously(captchaToken ? { options: { captchaToken } } : undefined);
  if (error) {
    if (looksLikeCaptchaError(error.message)) {
      throw new CaptchaError('The security check failed or expired. Please try again.');
    }
    console.error('Anonymous sign-in failed. Is it enabled in Supabase Auth settings?', error.message);
    throw new Error('Couldn’t start a visitor session. Please try again later.');
  }
}

function friendlyError(error: { message: string; code?: string }): Error {
  console.error('Supabase error:', error.code, error.message);
  // The rate-limit trigger raises its own readable message (P0001)
  if (error.code === 'P0001') return new Error(error.message);
  if (error.code === '42501') return new Error('You can’t do that right now.');
  return new Error('Something went wrong. Please try again.');
}

export function useSuggestions(projectId: string | undefined) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (cancelled) return;
      if (error) {
        console.error('Error fetching suggestions:', error.message);
        setLoadError(error.message);
      } else {
        setSuggestions(data as Suggestion[]);
      }
      setIsLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const create = useCallback(
    async (input: NewSuggestion) => {
      await ensureSession(input.captchaToken);

      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          project_id: projectId,
          kind: input.kind,
          title: input.title,
          body: input.body,
          author_name: input.authorName,
        })
        .select()
        .single();

      if (error) throw friendlyError(error);
      setSuggestions((prev) => [data as Suggestion, ...prev]);
    },
    [projectId],
  );

  const remove = useCallback(async (id: string) => {
    // .select() so that "row not found / not allowed" is an error instead of a silent no-op
    const { data, error } = await supabase.from('suggestions').delete().eq('id', id).select('id');
    if (error) throw friendlyError(error);
    if (!data || data.length === 0) throw new Error('Couldn’t delete that suggestion.');
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const review = useCallback(
    async (id: string, changes: { status: SuggestionStatus; admin_response: string | null }) => {
      const { data, error } = await supabase
        .from('suggestions')
        .update(changes)
        .eq('id', id)
        .select()
        .single();
      if (error) throw friendlyError(error);
      setSuggestions((prev) => prev.map((s) => (s.id === id ? (data as Suggestion) : s)));
    },
    [],
  );

  return { suggestions, isLoading, loadError, create, remove, review };
}