import { webUrl, type Locale, type MyHostResponse, type WebPathname } from '@juandavidfuentes/indomitox-shared';
import { useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { api, ApiError, WEB_URL } from './api';
import { useAuth } from './auth';
import { isHostPanelNoticeDismissed } from './preferences';

export const HOST_KEY = ['host'] as const;

/** Mi Guía (o null si aún no empezó el alta). */
export function useMyHost() {
  const { status } = useAuth();
  return useQuery({
    queryKey: HOST_KEY,
    queryFn: async () => {
      try {
        return await api<MyHostResponse>('/v1/host');
      } catch (error) {
        if (error instanceof ApiError && error.code === 'HOST_NOT_FOUND') return null;
        throw error;
      }
    },
    enabled: status === 'signedIn',
  });
}

/** Abre el panel del Guía; la primera vez, con el aviso de administrar desde la web (MOB-02). */
export function openHostPanel(): void {
  router.push((isHostPanelNoticeDismissed() ? '/panel' : '/panel/aviso') as Href);
}

/**
 * Abre una página de la web en el navegador del sistema: el alta, la edición completa de las
 * publicaciones y lo que el panel móvil no hace (MOB-02).
 */
export function openOnWeb(locale: Locale, pathname: WebPathname, params?: Record<string, string>): void {
  void WebBrowser.openBrowserAsync(webUrl(WEB_URL, pathname, locale, {}, params));
}
