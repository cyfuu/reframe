import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export function Login() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      navigate('/projects');
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm pt-6 md:pt-16">
      <p className="font-mono text-xs uppercase tracking-widest">admin only</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-mute">Manage projects and write release notes.</p>

      <form onSubmit={handleLogin} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-[var(--k-bugfix)]/40 bg-[var(--k-bugfix)]/10 px-3 py-2 text-sm text-[var(--k-bugfix)]">
            {error}
          </p>
        )}

        <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-2.5">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}