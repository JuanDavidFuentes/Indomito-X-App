import type { AuthResponse, AuthUser } from '@juandavidfuentes/indomitox-shared';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, clearTokens, getStoredRefreshToken, onSignedOut, refreshSession, saveTokens } from './api';

/**
 * - loading: arrancando (se renueva la sesión guardada).
 * - offline: hay una sesión guardada pero no hubo red para confirmarla.
 */
export type AuthStatus = 'loading' | 'offline' | 'signedIn' | 'signedOut';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Tras ingresar o registrarse: guarda los tokens y abre la sesión. */
  signIn(response: AuthResponse): Promise<void>;
  /** Cierra la sesión de este teléfono (o de todos, con `everywhere`). */
  signOut(options?: { everywhere?: boolean }): Promise<void>;
  /** Actualiza el usuario después de editar el perfil o verificar el correo. */
  setUser(user: AuthUser): void;
  /** Reintenta confirmar la sesión guardada (estado offline). */
  retry(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Sesión de la app (AUTH-05): el refresh token vive en expo-secure-store y rota en cada renovación. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    refreshSession()
      .then((response) => {
        if (cancelled) return;
        setUserState(response?.user ?? null);
        setStatus(response ? 'signedIn' : 'signedOut');
      })
      .catch(() => {
        if (!cancelled) setStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Si una renovación falla con 401 (sesión cerrada en otro equipo, token reutilizado…).
  useEffect(
    () =>
      onSignedOut(() => {
        setUserState(null);
        setStatus('signedOut');
        queryClient.clear();
      }),
    [queryClient],
  );

  const signIn = useCallback(async (response: AuthResponse) => {
    if (!response.tokens) throw new ApiError(500, 'INTERNAL_ERROR', 'La API no envió los tokens');
    await saveTokens(response.tokens);
    setUserState(response.user);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(
    async ({ everywhere = false }: { everywhere?: boolean } = {}) => {
      try {
        if (everywhere) await api('/v1/auth/logout-all', { method: 'POST' });
        else await api('/v1/auth/logout', { method: 'POST', body: { refreshToken: await getStoredRefreshToken() } });
      } catch {
        // Aunque la API no responda, el teléfono olvida la sesión.
      }
      await clearTokens();
      queryClient.clear();
      setUserState(null);
      setStatus('signedOut');
    },
    [queryClient],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn,
      signOut,
      setUser: setUserState,
      retry: () => {
        setStatus('loading');
        setAttempt((n) => n + 1);
      },
    }),
    [status, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
