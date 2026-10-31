export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'portfolio:theme';

/** Stored choice, then the OS preference, then dark (the design's default). */
export function resolveTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage can be unavailable; the OS preference still applies.
  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Keeps the browser chrome (address bar, form controls) in step with the page.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f4efe6' : '#08090c');
}

export function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not fatal: the toggle still works for this session.
  }
}

export function createThemeToggle(onChange?: (theme: Theme) => void): Theme {
  let current = resolveTheme();
  applyTheme(current);

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    button.addEventListener('click', () => {
      current = current === 'dark' ? 'light' : 'dark';
      applyTheme(current);
      persistTheme(current);
      onChange?.(current);
    });
  }

  // Follow the OS only while the visitor has not chosen explicitly.
  const query = window.matchMedia('(prefers-color-scheme: light)');
  query.addEventListener('change', (event) => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (saved) return;
    current = event.matches ? 'light' : 'dark';
    applyTheme(current);
    onChange?.(current);
  });

  return current;
}
