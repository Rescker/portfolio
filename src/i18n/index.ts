import { locales, messages, meta, type Locale, type MessageKey } from './messages';

const STORAGE_KEY = 'portfolio:locale';

/**
 * Resolution order: saved choice, then browser language, then pt. A saved choice
 * always wins — a visitor who picked English should not be flipped back by a
 * different `navigator.language` on the next visit.
 */
export function resolveLocale(): Locale {
  const saved = read();
  if (saved) return saved;

  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const tag of candidates) {
    const base = tag?.toLowerCase().split('-')[0];
    if (base && (locales as readonly string[]).includes(base)) return base as Locale;
  }
  return 'pt';
}

function read(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value && (locales as readonly string[]).includes(value) ? (value as Locale) : null;
  } catch {
    // Private mode or a blocked storage partition: fall through to detection.
    return null;
  }
}

function persist(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Persistence is a convenience, never a requirement.
  }
}

/**
 * Applies a locale to the DOM. Elements declare `data-i18n` (text) or
 * `data-i18n-html` (markup). Attributes listed in `data-i18n-attr` are updated
 * too, so links and labels can be localized without duplicating markup.
 */
export function applyLocale(locale: Locale) {
  const table = messages[locale];

  document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en-US';

  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = node.dataset.i18n as MessageKey;
    const value = table[key];
    if (value === undefined) continue;
    node.textContent = value;
  }

  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n-html]')) {
    const key = node.dataset.i18nHtml as MessageKey;
    const value = table[key];
    if (value === undefined) continue;
    node.innerHTML = value;
  }

  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
    for (const pair of (node.dataset.i18nAttr ?? '').split(',')) {
      const [attribute, key] = pair.split(':').map((part) => part.trim());
      if (!attribute || !key) continue;
      const value = table[key as MessageKey];
      if (value !== undefined) node.setAttribute(attribute, value);
    }
  }

  document.title = meta[locale].title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', meta[locale].description);

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-locale]')) {
    const active = button.dataset.locale === locale;
    button.setAttribute('aria-pressed', String(active));
  }
}

/**
 * Wires the switcher and returns the active locale. Headings split into words by
 * the animation layer must be re-split after their text changes, which is why the
 * caller gets a hook instead of this module reaching into the motion code.
 */
export function createLocaleSwitcher(onChange?: (locale: Locale) => void): Locale {
  let current = resolveLocale();
  applyLocale(current);

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-locale]')) {
    button.addEventListener('click', () => {
      const next = button.dataset.locale as Locale | undefined;
      if (!next || next === current) return;
      current = next;
      persist(current);
      applyLocale(current);
      onChange?.(current);
    });
  }

  return current;
}
