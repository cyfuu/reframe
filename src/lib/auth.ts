import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  /** True only for the site owner. Anonymous visitor sessions are never admin. */
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);