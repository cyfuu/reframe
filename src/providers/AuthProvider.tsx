import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function apply(session: Session | null) {
      const nextUser = session?.user ?? null;
      let admin = false;

      // Visitors will get anonymous sessions, which also count as "logged in".
      // Admin is decided by the database (public.is_admin), never by "user exists".
      if (nextUser && !nextUser.is_anonymous) {
        const { data, error } = await supabase.rpc('is_admin');
        if (error) {
          console.warn('is_admin() failed. Has migration 001 been applied?', error.message);
        } else {
          admin = data === true;
        }
      }

      if (!cancelled) {
        setUser(nextUser);
        setIsAdmin(admin);
        setIsLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => apply(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Don't call supabase from inside this callback directly (deadlock risk).
      setTimeout(() => void apply(session), 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ user, isAdmin, isLoading, signOut }),
    [user, isAdmin, isLoading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}