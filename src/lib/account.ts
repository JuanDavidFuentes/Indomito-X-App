import type { MeResponse, SavedParticipant, SportDto } from '@juandavidfuentes/indomitox-shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useAuth } from './auth';

export const ME_KEY = ['me'] as const;
export const PARTICIPANTS_KEY = ['me', 'participants'] as const;

/** Perfil completo del Explorador (EXP-02). */
export function useMe() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => api<MeResponse>('/v1/me'),
    enabled: status === 'signedIn',
    staleTime: 30_000,
  });
}

export function useParticipants() {
  const { status } = useAuth();
  return useQuery({
    queryKey: PARTICIPANTS_KEY,
    queryFn: () => api<SavedParticipant[]>('/v1/me/participants'),
    enabled: status === 'signedIn',
  });
}

/** Catálogo de deportes (cambia poco: se guarda una hora). */
export function useSports() {
  return useQuery({ queryKey: ['sports'], queryFn: () => api<SportDto[]>('/v1/sports'), staleTime: 60 * 60_000 });
}

/** Guarda la respuesta de la API en la caché del perfil y en la sesión. */
export function useStoreMe() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  return (me: MeResponse) => {
    queryClient.setQueryData(ME_KEY, me);
    setUser(me.user);
  };
}
