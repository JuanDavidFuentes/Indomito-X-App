/*
 * Enlaces que abren la app (EXP-04): los de la web (`https://indomitox.co/es/rafting/san-gil/…`,
 * verificados con App Links y Universal Links) y los del esquema propio (`indomitox://…`). Las
 * rutas de la web se traducen a las pantallas de la app; lo que la app no tiene abre Explorar.
 */
const WEB_HOSTS = /^https?:\/\/(?:www\.)?indomitox\.co(?=\/|$)/i;
const LOCALE = '(?:es|en|fr)';
/** Primeros segmentos de la web que no son deportes (guías, cuenta, panel…). */
const NOT_SPORTS = new Set(['guias', 'guides', 'buscar', 'search', 'recherche', 'cuenta', 'account', 'compte', 'panel', 'dashboard', 'tableau-de-bord', 'admin', 'legal', 'creditos', 'credits', 'ingresar', 'sign-in', 'connexion', 'registro', 'sign-up', 'inscription', 'verificar', 'verify-email', 'verifier-email', 'recuperar', 'reset-password', 'reinitialiser-mot-de-passe', 'invitacion', 'invitation']);

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const local = path.replace(WEB_HOSTS, '');
    if (local === path && /^[a-z][\w+.-]*:\/\//i.test(path) && !path.startsWith('indomitox://')) return path;
    const [pathname = '', search = ''] = local.replace(/^indomitox:\/\//i, '/').split('?');
    const segments = pathname.split('/').filter(Boolean);
    if (!segments.length || !new RegExp(`^${LOCALE}$`).test(segments[0]!)) return local || '/';
    const [, first, second, third] = segments;
    if (!first) return '/';
    if (NOT_SPORTS.has(first)) return first === 'buscar' || first === 'search' || first === 'recherche' ? `/mapa${search ? `?${search}` : ''}` : '/';
    // /{idioma}/{deporte}/{ciudad}/{slug} → detalle; /{idioma}/{deporte}[/{ciudad}] → mapa filtrado.
    if (third) return `/listing/${encodeURIComponent(third)}`;
    return `/mapa?sportSlug=${encodeURIComponent(first)}${second ? `&place=${encodeURIComponent(second)}` : ''}`;
  } catch {
    return '/';
  }
}
