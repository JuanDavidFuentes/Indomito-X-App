import {
  addDays,
  formatMoney,
  localDate,
  pickLocalized,
  pickVariant,
  PLATFORM_TIMEZONE,
  type CalendarResponse,
  type HostListingFilter,
  type HostListingResponse,
  type HostListingsResponse,
  type ListingHostAction,
  type ListingPhotoDto,
  type Locale,
  type LocalizedText,
  type PriceUnit,
} from '@juandavidfuentes/indomitox-shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, mediaUrl } from './api';
import { useAuth } from './auth';

/*
 * Panel móvil del Guía (MOB-01/03): las mismas rutas de la API que usa la web
 * (`/v1/host/listings`, `/v1/host/calendar`, `/v1/host/slots`).
 */

export const LISTINGS_KEY = ['host', 'listings'] as const;
export const listingKey = (id: string) => ['host', 'listing', id] as const;
export const CALENDAR_KEY = ['host', 'calendar'] as const;

/** Días que muestra el calendario del teléfono (cuatro semanas desde hoy). */
export const MOBILE_CALENDAR_DAYS = 28;

export function useHostListings(filter: HostListingFilter = 'ALL') {
  const { status } = useAuth();
  return useQuery({
    queryKey: [...LISTINGS_KEY, filter],
    queryFn: () => api<HostListingsResponse>(`/v1/host/listings?status=${filter}`),
    enabled: status === 'signedIn',
    staleTime: 15_000,
    // Al cambiar de filtro se ve la lista anterior hasta que llega la nueva.
    placeholderData: (previous) => previous,
  });
}

export function useHostListing(id: string) {
  return useQuery({
    queryKey: listingKey(id),
    queryFn: () => api<HostListingResponse>(`/v1/host/listings/${id}`),
    staleTime: 10_000,
  });
}

/** Horarios, bloqueos y horarios de atención desde hoy (fecha de Bogotá). */
export function useHostCalendar(listingId?: string, days = MOBILE_CALENDAR_DAYS) {
  const from = localDate(new Date());
  const to = addDays(from, days - 1);
  // Sin URLSearchParams: la implementación de React Native está incompleta.
  const search = `from=${from}&to=${to}${listingId ? `&listingId=${encodeURIComponent(listingId)}` : ''}`;
  return useQuery({
    queryKey: [...CALENDAR_KEY, from, to, listingId ?? 'all'],
    queryFn: () => api<CalendarResponse>(`/v1/host/calendar?${search}`),
    staleTime: 10_000,
  });
}

/**
 * Deslizar para actualizar: el indicador gira solo cuando el usuario lo pide (no con las
 * recargas en segundo plano de TanStack Query).
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };
  return { refreshing, onRefresh: () => void onRefresh() };
}

/** Guarda la respuesta de un cambio y marca como viejas la lista y el calendario. */
export function useStoreListing() {
  const queryClient = useQueryClient();
  return (result: HostListingResponse) => {
    queryClient.setQueryData(listingKey(result.listing.id), result);
    void queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
    void queryClient.invalidateQueries({ queryKey: CALENDAR_KEY });
  };
}

export function transitionListing(id: string, action: ListingHostAction) {
  return api<HostListingResponse>(`/v1/host/listings/${id}/transition`, { method: 'POST', body: { action } });
}

/** Acciones que se hacen desde el teléfono; archivar y restaurar quedan en la web. */
export const MOBILE_LISTING_ACTIONS = ['PUBLISH', 'PAUSE', 'RESUME', 'WITHDRAW'] as const satisfies readonly ListingHostAction[];

/** Título en el idioma de la interfaz (o el original) o "Sin título". */
export function useListingTitle() {
  const { t, i18n } = useTranslation();
  return (title: LocalizedText) => pickLocalized(title, i18n.language as Locale)?.text || t('listings.untitled');
}

/** "$80.000 por persona" con el formato del idioma (o "Sin precio"). */
export function usePriceLabel() {
  const { t, i18n } = useTranslation();
  return (minor: number | null, unit: PriceUnit) =>
    minor === null ? t('listings.noPrice') : `${formatMoney(minor, 'COP', i18n.language as Locale)} ${t(`priceUnit.${unit}`)}`;
}

/** URL de la variante WebP más cercana al ancho pedido (en el emulador, con la IP del PC). */
export function photoUrl(photo: ListingPhotoDto | null | undefined, minWidth: number): string | null {
  if (!photo) return null;
  return mediaUrl(pickVariant(photo.variants, minWidth)?.url);
}

/** Fecha y hora en la zona de la plataforma (Hermes trae `Intl.DateTimeFormat`). */
export function formatInstant(instant: string | Date, locale: Locale, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { timeZone: PLATFORM_TIMEZONE, ...options }).format(new Date(instant));
}

/** Una fecha "AAAA-MM-DD" a mediodía de Bogotá (así ninguna zona la corre de día). */
export function noonOf(date: string): Date {
  return new Date(`${date}T17:00:00Z`);
}

export function pesosToMinor(value: string): number | null {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? Number(digits) * 100 : null;
}

export function minorToPesos(minor: number | null | undefined): string {
  return minor === null || minor === undefined ? '' : String(Math.round(minor / 100));
}
