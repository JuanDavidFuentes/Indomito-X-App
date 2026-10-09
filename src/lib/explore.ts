import {
  DEFAULT_APPROX_CURRENCY,
  priceDisplay,
  searchQueryToParams,
  toQueryString,
  type Currency,
  type FxRatesResponse,
  type ListingCardDto,
  type ListingPinsResponse,
  type ListingSearchResponse,
  type Locale,
  type PriceDisplay,
  type PublicListingDetail,
  type SearchFacetsResponse,
  type SearchPlace,
  type SearchQuery,
} from '@juandavidfuentes/indomitox-shared';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from './api';
import { getStoredCurrency, setStoredCurrency } from './preferences';

/*
 * Explorar, mapa y detalle (F4) en la app: la misma búsqueda pública de la web
 * (`GET /v1/search`), las tasas de cambio y la moneda elegida.
 */

const qs = (query: Partial<SearchQuery>) => toQueryString(searchQueryToParams(query));

/** Resultados por páginas (la hoja del mapa carga más al llegar al final). */
export function useSearchList(query: SearchQuery) {
  const base = qs({ ...query, page: 1 });
  return useInfiniteQuery({
    queryKey: ['search', base],
    queryFn: ({ pageParam }) => api<ListingSearchResponse>(`/v1/search?${qs({ ...query, page: pageParam })}`),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.pageSize < last.total ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Pines del mapa (todos los resultados de la búsqueda). */
export function useSearchPins(query: SearchQuery) {
  const key = qs({ ...query, page: 1, sort: 'RELEVANCE' });
  return useQuery({
    queryKey: ['search-pins', key],
    queryFn: () => api<ListingPinsResponse>(`/v1/search/pins${key ? `?${key}` : ''}`),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Aventuras recomendadas (Explorar). */
export function useFeatured() {
  return useQuery({
    queryKey: ['search', 'featured'],
    queryFn: () => api<ListingSearchResponse>('/v1/search'),
    staleTime: 5 * 60_000,
  });
}

/** Deportes con aventuras en un lugar (las fichas del mapa). */
export function useSportFacets(place: string | undefined) {
  return useQuery({
    queryKey: ['facets', place ?? ''],
    queryFn: () => api<SearchFacetsResponse>(`/v1/search/facets${place ? `?place=${place}` : ''}`),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

/** Valor que cambia solo después de `delay` ms sin cambios. */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Destinos para el autocompletado (sin texto: las zonas destacadas con sus conteos). */
export function usePlaces(text: string, enabled = true) {
  const q = useDebounced(text.trim());
  return useQuery({
    queryKey: ['places', q.toLowerCase()],
    queryFn: () => api<SearchPlace[]>(`/v1/places?limit=8${q ? `&q=${encodeURIComponent(q)}` : ''}`),
    enabled: enabled && (q.length === 0 || q.length >= 2),
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useListingDetail(slug: string) {
  return useQuery({ queryKey: ['listing', slug], queryFn: () => api<PublicListingDetail>(`/v1/listings/${slug}`), staleTime: 60_000 });
}

/** Tarjeta del pin seleccionado. */
export function useListingCard(id: string | null) {
  return useQuery({
    queryKey: ['search-card', id],
    queryFn: async () => (await api<ListingCardDto[]>(`/v1/search/cards?ids=${id}`))[0] ?? null,
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

// ─── Moneda y tasas (SRCH-07, I18N-03) ─────────────────────────

export function useFxRates() {
  return useQuery({ queryKey: ['fx'], queryFn: () => api<FxRatesResponse>('/v1/fx/rates'), staleTime: 60 * 60_000 });
}

const listeners = new Set<() => void>();
let storedCurrency = getStoredCurrency();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Moneda del aproximado: la elegida en Perfil o la del idioma (dólares en es/en, euros en fr). */
export function useCurrency(): [Currency, (currency: Currency) => void] {
  const { i18n } = useTranslation();
  const chosen = useSyncExternalStore(subscribe, () => storedCurrency);
  const setCurrency = useCallback((currency: Currency) => {
    storedCurrency = currency;
    setStoredCurrency(currency);
    listeners.forEach((listener) => listener());
  }, []);
  return [chosen ?? DEFAULT_APPROX_CURRENCY[i18n.language as Locale] ?? 'USD', setCurrency];
}

/** Pesos y su aproximado ("$80.000" y "≈ US$25"). */
export function usePrice(): (amountMinor: number) => PriceDisplay {
  const { i18n } = useTranslation();
  const { data } = useFxRates();
  const [currency] = useCurrency();
  return useCallback((amountMinor: number) => priceDisplay(amountMinor, currency, i18n.language as Locale, data?.rates), [currency, i18n.language, data]);
}
