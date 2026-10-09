import type { CreateWishlistInput, WishlistDetail, WishlistsResponse, WishlistSummary } from '@juandavidfuentes/indomitox-shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { api } from './api';
import { useAuth } from './auth';

/*
 * Favoritos en listas (EXP-01), igual que en la web. AUTH-07: sin sesión, el corazón abre el
 * ingreso (modal) y al terminar se vuelve a la pantalla.
 */

export const WISHLISTS_KEY = ['wishlists'] as const;
export const wishlistKey = (id: string) => ['wishlist', id] as const;

export function useWishlists() {
  const { status } = useAuth();
  return useQuery({
    queryKey: WISHLISTS_KEY,
    queryFn: () => api<WishlistsResponse>('/v1/me/wishlists'),
    enabled: status === 'signedIn',
    staleTime: 30_000,
  });
}

export function useWishlist(id: string) {
  return useQuery({ queryKey: wishlistKey(id), queryFn: () => api<WishlistDetail>(`/v1/me/wishlists/${id}`), staleTime: 15_000 });
}

export function useWishlistActions() {
  const queryClient = useQueryClient();
  const options = {
    onSettled: () => queryClient.invalidateQueries({ predicate: (query) => ['wishlists', 'wishlist'].includes(String(query.queryKey[0])) }),
  };
  return {
    create: useMutation({ mutationFn: (input: CreateWishlistInput) => api<WishlistSummary>('/v1/me/wishlists', { method: 'POST', body: input }), ...options }),
    add: useMutation({
      mutationFn: ({ listId, listingId }: { listId: string; listingId: string }) => api(`/v1/me/wishlists/${listId}/items/${listingId}`, { method: 'PUT' }),
      ...options,
    }),
    remove: useMutation({
      mutationFn: ({ listId, listingId }: { listId: string; listingId: string }) => api(`/v1/me/wishlists/${listId}/items/${listingId}`, { method: 'DELETE' }),
      ...options,
    }),
    unsave: useMutation({ mutationFn: (listingId: string) => api(`/v1/me/saved/${listingId}`, { method: 'DELETE' }), ...options }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) => api<WishlistSummary>(`/v1/me/wishlists/${id}`, { method: 'PATCH', body: { name } }),
      ...options,
    }),
    destroy: useMutation({ mutationFn: (id: string) => api(`/v1/me/wishlists/${id}`, { method: 'DELETE' }), ...options }),
  };
}

/**
 * Corazón de una publicación: guardado o no, y qué hace al tocarlo (ingresar, quitar de todas
 * las listas o abrir "Guardar en una lista").
 */
export function useFavorite(listingId: string, title: string) {
  const { status } = useAuth();
  const { data } = useWishlists();
  const saved = useMemo(() => new Set(data?.savedListingIds ?? []).has(listingId), [data, listingId]);
  const { unsave } = useWishlistActions();
  const toggle = () => {
    if (status !== 'signedIn') return router.push('/auth/ingresar');
    if (saved) return unsave.mutate(listingId);
    router.push({ pathname: '/favoritos/guardar', params: { listingId, title } });
  };
  return { saved, toggle, busy: unsave.isPending };
}
