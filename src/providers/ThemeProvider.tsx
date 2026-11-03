import { useEffect, useMemo, useState } from 'react';
import { ThemeContext, type Theme } from '../lib/theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const themeColor = theme === 'dark' ? '#0c0e10' : '#eef0f2';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.backgroundColor = themeColor;
    localStorage.setItem('theme', theme);
    const mobileViewport = window.matchMedia('(max-width: 767px)');
    const updateFavicon = () => {
      document.querySelector('link[rel="icon"]')?.setAttribute(
        'href',
        `${import.meta.env.BASE_URL}${
          mobileViewport.matches ? (theme === 'dark' ? 'logo.svg' : 'logo-dark.svg') : 'logo.svg'
        }`,
      );
    };
    updateFavicon();
    mobileViewport.addEventListener('change', updateFavicon);
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      const updatedThemeColorMeta = themeColorMeta.cloneNode(true) as HTMLMetaElement;
      updatedThemeColorMeta.content = themeColor;
      themeColorMeta.replaceWith(updatedThemeColorMeta);
    }

    return () => mobileViewport.removeEventListener('change', updateFavicon);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}