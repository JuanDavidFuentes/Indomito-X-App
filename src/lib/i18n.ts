import { DEFAULT_LOCALE, LOCALES, type Locale } from '@juandavidfuentes/indomitox-shared';
import { messages } from '@juandavidfuentes/indomitox-shared/i18n';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import { getStoredLocale, setStoredLocale } from './preferences';

/** Idioma del dispositivo si lo soportamos; si no, español. */
export function detectLocale(): Locale {
  const code = getLocales()[0]?.languageCode ?? '';
  return (LOCALES as readonly string[]).includes(code) ? (code as Locale) : DEFAULT_LOCALE;
}

// Mismos mensajes ICU que la web (paquete compartido). El idioma elegido en Perfil se guarda
// en el dispositivo y manda sobre el del sistema.
// La instancia por defecto de i18next es la API documentada; la regla confunde `use` con el export nombrado.
// eslint-disable-next-line import/no-named-as-default-member
void i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(LOCALES.map((l) => [l, { translation: messages[l] }])),
    lng: getStoredLocale() ?? detectLocale(),
    fallbackLng: DEFAULT_LOCALE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });

i18n.on('languageChanged', (lng) => {
  if ((LOCALES as readonly string[]).includes(lng)) setStoredLocale(lng as Locale);
});

/** Idioma actual de la interfaz (para enviarlo a la API al registrarse o pedir correos). */
export function currentLocale(): Locale {
  return (LOCALES as readonly string[]).includes(i18n.language) ? (i18n.language as Locale) : DEFAULT_LOCALE;
}

export default i18n;
