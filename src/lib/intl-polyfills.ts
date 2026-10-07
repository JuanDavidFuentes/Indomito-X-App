/**
 * Hermes (el motor de JavaScript de la app) no trae `Intl.PluralRules`, que necesita
 * intl-messageformat para los plurales ICU ("{count, plural, one {…} other {…}}").
 * Se instala solo si falta, con los datos de los tres idiomas de la app.
 * Debe importarse antes que i18n (ver src/app/_layout.tsx).
 */
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/es.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/fr.js';
