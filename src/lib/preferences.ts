import { LOCALES, type Locale } from '@juandavidfuentes/indomitox-shared';
import Storage from 'expo-sqlite/kv-store';

/**
 * Preferencias del dispositivo (idioma y tema). Se leen de forma síncrona al arrancar para
 * que la app abra ya en el idioma y el tema elegidos, sin parpadeo. No son datos sensibles:
 * los tokens van en expo-secure-store (lib/api.ts).
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

const KEYS = { locale: 'prefs.locale', theme: 'prefs.theme', hostPanelNotice: 'prefs.hostPanelNoticeDismissed' } as const;
const THEMES: readonly ThemeChoice[] = ['system', 'light', 'dark'];

function read(key: string): string | null {
  try {
    return Storage.getItemSync(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    Storage.setItemSync(key, value);
  } catch {
    // Si el almacenamiento falla, la preferencia dura solo esta sesión.
  }
}

export function getStoredLocale(): Locale | null {
  const value = read(KEYS.locale);
  return value && (LOCALES as readonly string[]).includes(value) ? (value as Locale) : null;
}

export function setStoredLocale(locale: Locale): void {
  write(KEYS.locale, locale);
}

export function getStoredTheme(): ThemeChoice {
  const value = read(KEYS.theme);
  return value && (THEMES as readonly string[]).includes(value) ? (value as ThemeChoice) : 'system';
}

export function setStoredTheme(theme: ThemeChoice): void {
  write(KEYS.theme, theme);
}

/** MOB-02: el Guía eligió "No volver a mostrar" el aviso de administrar desde la web. */
export function isHostPanelNoticeDismissed(): boolean {
  return read(KEYS.hostPanelNotice) === '1';
}

export function dismissHostPanelNotice(): void {
  write(KEYS.hostPanelNotice, '1');
}
