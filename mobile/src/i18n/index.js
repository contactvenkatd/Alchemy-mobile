import en from './en.js';
import hi from './hi.js';

export const dictionaries = { en, hi };

/** The locale the app starts in before the user picks one. */
export const DEFAULT_LANGUAGE = 'en';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
];

function lookup(dict, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), dict);
}

/**
 * Translate `path` in `lang`, falling back to English and then to the key
 * itself so a missing string never renders as blank space.
 * Supports {name} placeholders.
 */
export function translate(lang, path, vars) {
  const value = lookup(dictionaries[lang] || dictionaries.en, path) ?? lookup(dictionaries.en, path) ?? path;
  if (typeof value !== 'string' || !vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, key) => (vars[key] != null ? String(vars[key]) : match));
}
