import { Link, NavLink, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="inline-flex size-8 items-center justify-center rounded-md border border-line text-mute transition-colors hover:border-line-strong hover:text-ink"
    >
      {theme === 'dark' ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

export function AppShell() {
  const { isAdmin, signOut } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            color: 'var(--ink)',
            border: '1px solid var(--line)',
            borderRadius: '6px',
            boxShadow: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: 'var(--k-feature)', secondary: 'var(--surface)' } },
          error: { iconTheme: { primary: 'var(--k-bugfix)', secondary: 'var(--surface)' } },
        }}
      />

      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="font-mono text-sm font-semibold tracking-tight text-ink">
              reframe
            </Link>

            <nav aria-label="Primary">
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  `font-mono text-[13px] transition-colors ${
                    isActive ? 'text-ink' : 'text-mute hover:text-ink'
                  }`
                }
              >
                projects
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <span className="hidden items-center gap-1.5 font-mono text-xs text-accent-text sm:inline-flex">
                <span className="size-1.5 rounded-full bg-accent-text" aria-hidden="true" />
                admin
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 md:py-14">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-5 font-mono text-xs text-mute sm:px-8">
          <span>© {new Date().getFullYear()} reframe</span>

          <div className="flex items-center gap-5">
            <a
              href="https://github.com/cyfuu/reframe"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink"
            >
              source <span aria-hidden="true">↗</span>
            </a>
            {isAdmin && (
              <button type="button" onClick={() => void signOut()} className="transition-colors hover:text-ink">
                sign out
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}