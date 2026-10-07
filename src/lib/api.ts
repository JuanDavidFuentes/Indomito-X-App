import {
  CLIENT_HEADER,
  isApiErrorCode,
  MOBILE_CLIENT,
  type ApiErrorCode,
  type AuthResponse,
  type AuthTokens,
  type ValidationIssue,
} from '@juandavidfuentes/indomitox-shared';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * URL de la API. En el emulador de Android, "localhost" del PC es 10.0.2.2; en un teléfono
 * real hay que poner la IP del PC en `app/.env` (EXPO_PUBLIC_API_URL).
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');

/** URL de la web (documentos legales y enlaces que se abren en el navegador). */
export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

/**
 * Imágenes subidas por los usuarios (bucket público de S3). En local la API las entrega como
 * `http://localhost:9000/…`, que desde el emulador de Android es 10.0.2.2 (como la API).
 */
export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (Platform.OS !== 'android') return url;
  const host = /^https?:\/\/([^/:]+)/.exec(API_URL)?.[1];
  return host ? url.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/])/, `$1${host}`) : url;
}

const REFRESH_KEY = 'auth.refreshToken';

/** Error de la API con su código estable (los textos salen de i18n `errors.<code>`). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get issues(): ValidationIssue[] {
    return this.code === 'VALIDATION_ERROR' && Array.isArray(this.details) ? (this.details as ValidationIssue[]) : [];
  }
}

// ─── Tokens ────────────────────────────────────────────────────
// El token de acceso vive solo en memoria; el refresh token, cifrado en el llavero del
// sistema (Keystore en Android, Keychain en iOS) con expo-secure-store.

let accessToken: string | null = null;
let accessExpiresAt = 0;
const signedOutListeners = new Set<() => void>();

/** Avisa cuando la sesión se pierde (refresh inválido o reutilizado): la app vuelve a "sin sesión". */
export function onSignedOut(listener: () => void): () => void {
  signedOutListeners.add(listener);
  return () => signedOutListeners.delete(listener);
}

export async function saveTokens(tokens: AuthTokens): Promise<void> {
  accessToken = tokens.accessToken;
  accessExpiresAt = new Date(tokens.accessTokenExpiresAt).getTime();
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  accessExpiresAt = 0;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

let refreshing: Promise<AuthResponse | null> | null = null;

/**
 * Renueva la sesión con el refresh token (rotación: cada vez llega uno nuevo). Si varias
 * peticiones lo necesitan a la vez, se hace una sola renovación.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= (async () => {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) return null;
    let res: Response;
    try {
      res = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { [CLIENT_HEADER]: MOBILE_CLIENT, 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Sin red: la sesión sigue guardada y se reintentará después.
      throw new ApiError(0, 'NETWORK_ERROR', 'No hay conexión con la API');
    }
    if (!res.ok) {
      if (res.status === 401) {
        await clearTokens();
        signedOutListeners.forEach((listener) => listener());
      }
      return null;
    }
    const body = (await res.json()) as AuthResponse;
    if (body.tokens) await saveTokens(body.tokens);
    return body;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// ─── Peticiones ────────────────────────────────────────────────

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

/** Rutas que no llevan sesión: nunca disparan la renovación del token. */
const SESSIONLESS = new Set([
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/refresh',
  '/v1/auth/logout',
  '/v1/auth/google',
  '/v1/auth/apple',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/verify-email',
  '/v1/auth/providers',
  '/v1/sports',
]);

async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as { code?: string; message?: string; details?: unknown } | null;
  const code = body?.code && isApiErrorCode(body.code) ? body.code : res.status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST';
  return new ApiError(res.status, code, body?.message ?? String(res.status), body?.details);
}

/**
 * Llama a la API como la app: `x-client: mobile` y `Authorization: Bearer`. Renueva el token
 * de acceso si está por vencer o si la API responde 401, y reintenta una vez.
 */
export async function api<T = void>(path: string, options: ApiOptions = {}): Promise<T> {
  const withSession = !SESSIONLESS.has(path);
  if (withSession && accessToken && accessExpiresAt - Date.now() < 30_000) await refreshSession();
  if (withSession && !accessToken && (await getStoredRefreshToken())) await refreshSession();

  const send = () =>
    fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        [CLIENT_HEADER]: MOBILE_CLIENT,
        accept: 'application/json',
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && accessToken && withSession && (await refreshSession())) res = await send();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'No hay conexión con la API');
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
