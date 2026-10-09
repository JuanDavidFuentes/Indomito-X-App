import {
  activeFilterCount,
  DEFAULT_MAP_CENTER,
  GeoPointSchema,
  localizedOr,
  parseSearchParams,
  REMOVABLE_FILTERS,
  searchQueryToParams,
  toQueryString,
  type ListingPin,
  type Locale,
  type SearchPlace,
  type SearchQuery,
} from '@juandavidfuentes/indomitox-shared';
import BottomSheet, { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { Camera, GeoJSONSource, Layer, Map, type CameraRef, type GeoJSONSourceRef, type MapRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { Crosshair, FadersHorizontal, MagnifyingGlass, MapPin, Mountains, X } from 'phosphor-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FiltersSheet } from '@/components/explore/filters-sheet';
import { MapPreview } from '@/components/explore/map-preview';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { ListingCard } from '@/components/listing-card';
import { useSports } from '@/lib/account';
import { usePlaces, useSearchList, useSearchPins, useSportFacets } from '@/lib/explore';
import { useColorTheme, usePalette } from '@/lib/theme';

/** Mapas libres y sin clave (OpenFreeMap), igual que la web. */
const STYLES = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
} as const;

const ALL_PARAMS = [...REMOVABLE_FILTERS, 'radius', 'sort', 'page', 'sportSlug'] as const;
const SHEET_COLLAPSED = 132;

function pinsGeoJson(pins: ListingPin[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pins.map((pin) => ({ type: 'Feature', properties: { id: pin.id }, geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] } })),
  };
}

/**
 * Mapa (SRCH-02): pines agrupados (MapLibre nativo), hoja inferior con los resultados, buscador
 * de destinos, "Cerca de mí" (la ubicación se pide solo al tocarlo) y "Buscar en esta zona".
 * La búsqueda vive en los parámetros de la ruta: un enlace (`indomitox://mapa?place=san-gil`)
 * o la pantalla Explorar la abren ya filtrada.
 */
export default function MapScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const palette = usePalette();
  const scheme = useColorTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Record<string, string>>();
  const paramsKey = JSON.stringify(params);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- la clave resume los parámetros
  const query = useMemo(() => parseSearchParams(params), [paramsKey]);
  const list = useSearchList(query);
  const pins = useSearchPins(query);
  const facets = useSportFacets(query.place ?? list.data?.pages[0]?.place?.slug);
  const { data: sports } = useSports();
  const map = useRef<MapRef>(null);
  const camera = useRef<CameraRef>(null);
  const source = useRef<GeoJSONSourceRef>(null);
  const sheet = useRef<BottomSheet>(null);
  const filters = useRef<BottomSheetModal>(null);
  const [selection, setSelection] = useState<{ key: string; id: string | null }>({ key: '', id: null });
  // "Buscar en esta zona" aparece si el usuario movió el mapa en la búsqueda actual.
  const [movedIn, setMovedIn] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(1);
  const { height } = useWindowDimensions();
  const [locating, setLocating] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const suggestions = usePlaces(text ?? '', searching);

  const fitKey = toQueryString(searchQueryToParams({ ...query, page: 1, sort: 'RELEVANCE' }));
  const selected = selection.key === fitKey ? selection.id : null;
  const firstPage = list.data?.pages[0];
  const place = firstPage?.place ?? null;
  const placeName = place ? localizedOr(place.names, locale, place.slug) : null;
  const items = list.data?.pages.flatMap((page) => page.items) ?? [];
  const sportName = (key: string) => localizedOr(sports?.find((sport) => sport.key === key)?.names, locale, t(`sports.${key}`, { defaultValue: key }));

  const setQuery = (next: Partial<SearchQuery>) => {
    const values = searchQueryToParams({ ...next, page: 1 });
    router.setParams(Object.fromEntries(ALL_PARAMS.map((key) => [key, values[key]])) as Record<string, string>);
  };
  const update = (patch: Partial<SearchQuery>) => setQuery({ ...query, ...patch });
  const placeChange = (patch: Partial<SearchQuery>) => update({ place: undefined, q: undefined, near: undefined, radius: undefined, bbox: undefined, ...patch });

  // Un enlace de una página de aterrizaje trae la dirección del deporte: se cambia por su clave.
  useEffect(() => {
    if (!params.sportSlug || !sports) return;
    const sport = sports.find((item) => Object.values(item.slugs).includes(params.sportSlug!));
    router.setParams({ sportSlug: undefined, sport: sport?.key });
  }, [params.sportSlug, sports]);

  // La cámara se ajusta a los pines de cada búsqueda nueva (salvo "en esta zona").
  const fitted = useRef<string | null>(null);
  // El mapa nativo debe haber cargado el estilo; la hoja tapa la parte de abajo (medio mapa si está a la mitad).
  const bottomPadding = sheetIndex === 0 ? SHEET_COLLAPSED + 40 : Math.round(height * 0.45);
  useEffect(() => {
    const data = pins.data?.pins;
    if (!mapReady || !data || pins.isPlaceholderData || fitted.current === fitKey) return;
    fitted.current = fitKey;
    if (query.bbox || !data.length) return;
    const lngs = data.map((pin) => pin.lng);
    const lats = data.map((pin) => pin.lat);
    const bounds: [number, number, number, number] = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
    camera.current?.fitBounds(bounds, { padding: { top: insets.top + 170, bottom: bottomPadding, left: 48, right: 48 }, duration: 500 });
  }, [mapReady, pins.data, pins.isPlaceholderData, fitKey, query.bbox, insets.top, bottomPadding]);

  const nearMe = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert(t('search.nearMe'), t('search.locationDenied'), [
          { text: t('common.cancel'), style: 'cancel' },
          ...(permission.canAskAgain ? [] : [{ text: t('search.openSettings'), onPress: () => void Linking.openSettings() }]),
        ]);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const point = GeoPointSchema.safeParse({ lat: position.coords.latitude, lng: position.coords.longitude });
      if (!point.success) return Alert.alert(t('search.nearMe'), t('search.locationOutside'));
      placeChange({ near: point.data });
    } catch {
      Alert.alert(t('search.nearMe'), t('search.locationUnavailable'));
    } finally {
      setLocating(false);
    }
  };

  const searchArea = async () => {
    const bounds = await map.current?.getBounds();
    if (!bounds) return;
    const [west, south, east, north] = bounds;
    placeChange({ bbox: { west, south, east, north } });
  };

  const choosePlace = (item: SearchPlace) => {
    setText(null);
    setSearching(false);
    placeChange({ place: item.slug });
  };

  const heading = placeName
    ? t('search.headingIn', { place: placeName })
    : query.near
      ? t('search.headingNear')
      : query.bbox
        ? t('search.headingArea')
        : query.q
          ? t('search.headingQuery', { query: query.q })
          : t('search.heading');
  const filterCount = activeFilterCount(query) - (query.sport ? 1 : 0);
  const fieldText = text ?? placeName ?? query.q ?? '';

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Map
        ref={map}
        style={{ flex: 1 }}
        mapStyle={STYLES[scheme === 'dark' ? 'dark' : 'light']}
        logo={false}
        compass={false}
        attributionPosition={{ bottom: SHEET_COLLAPSED + 8, right: 8 }}
        onPress={() => setSelection({ key: fitKey, id: null })}
        onDidFinishLoadingMap={() => setMapReady(true)}
        onRegionDidChange={(event) => {
          if (event.nativeEvent.userInteraction) setMovedIn(fitKey);
        }}
      >
        <Camera ref={camera} initialViewState={{ center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat], zoom: DEFAULT_MAP_CENTER.zoom }} />
        <GeoJSONSource
          ref={source}
          id="pins"
          data={pinsGeoJson(pins.data?.pins ?? [])}
          cluster
          clusterRadius={46}
          clusterMaxZoom={13}
          hitbox={{ top: 12, right: 12, bottom: 12, left: 12 }}
          onPress={async (event) => {
            event.stopPropagation();
            const feature = event.nativeEvent.features[0];
            if (!feature || feature.geometry.type !== 'Point') return;
            const clusterId = feature.properties?.cluster_id as number | undefined;
            if (clusterId !== undefined) {
              const zoom = await source.current?.getClusterExpansionZoom(clusterId);
              camera.current?.easeTo({ center: feature.geometry.coordinates as [number, number], zoom: (zoom ?? 12) + 0.5, duration: 300 });
              return;
            }
            setSelection({ key: fitKey, id: String(feature.properties?.id) });
            sheet.current?.snapToIndex(0);
          }}
        >
          <Layer
            type="circle"
            id="clusters"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': palette.brand,
              'circle-radius': ['step', ['get', 'point_count'], 18, 10, 23, 30, 28],
              'circle-stroke-color': palette.background,
              'circle-stroke-width': 3,
            }}
          />
          <Layer
            type="symbol"
            id="cluster-count"
            filter={['has', 'point_count']}
            layout={{ 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 14, 'text-allow-overlap': true }}
            paint={{ 'text-color': palette.night }}
          />
          <Layer
            type="circle"
            id="pins"
            filter={['!', ['has', 'point_count']]}
            paint={{ 'circle-color': palette.brand, 'circle-radius': 10, 'circle-stroke-color': palette.background, 'circle-stroke-width': 3 }}
          />
          <Layer
            type="circle"
            id="pins-active"
            filter={['==', ['get', 'id'], selected ?? '']}
            paint={{ 'circle-color': palette.primary, 'circle-radius': 14, 'circle-stroke-color': palette.background, 'circle-stroke-width': 4 }}
          />
        </GeoJSONSource>
      </Map>

      {/* Buscador, "Cerca de mí", filtros y deportes */}
      <View className="absolute inset-x-0 top-0 gap-2 px-4" style={{ paddingTop: insets.top + 8 }} pointerEvents="box-none">
        <View className="flex-row items-center gap-2 rounded-full border border-border bg-card px-4 shadow-md" style={{ height: 52 }}>
          <MagnifyingGlass size={20} color={palette['muted-foreground']} />
          <TextInput
            accessibilityLabel={t('search.placeLabel')}
            placeholder={t('search.placePlaceholder')}
            placeholderTextColor={palette['muted-foreground']}
            value={fieldText}
            onFocus={() => setSearching(true)}
            onBlur={() => setSearching(false)}
            onChangeText={(value) => setText(value)}
            onSubmitEditing={() => {
              const value = (text ?? '').trim();
              setText(null);
              placeChange(value ? { q: value } : {});
            }}
            returnKeyType="search"
            autoCorrect={false}
            className="h-12 flex-1 font-sans text-base text-card-foreground"
          />
          {fieldText ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('search.clearPlace')}
              hitSlop={8}
              onPress={() => {
                setText(null);
                placeChange({});
              }}
              className="size-9 items-center justify-center"
            >
              <X size={18} color={palette['muted-foreground']} />
            </Pressable>
          ) : null}
        </View>

        {searching && suggestions.data?.length ? (
          <View accessibilityRole="list" className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            {suggestions.data.map((item) => (
              <Pressable
                key={`${item.kind}-${item.slug}`}
                accessibilityRole="button"
                onPress={() => choosePlace(item)}
                className="min-h-14 flex-row items-center gap-3 px-4 py-2 active:bg-muted"
              >
                {item.kind === 'ZONE' ? <Mountains size={22} color={palette.primary} /> : <MapPin size={22} color={palette['muted-foreground']} />}
                <View className="flex-1">
                  <Text className="font-sans-semibold text-base text-foreground">{localizedOr(item.names, locale, item.slug)}</Text>
                  <Text className="font-sans text-sm text-muted-foreground">
                    {item.departmentName} · {t('search.suggestionCount', { count: item.listingCount })}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            <View className="flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: Boolean(query.near), busy: locating }}
                onPress={() => void nearMe()}
                className={`h-11 flex-row items-center gap-2 rounded-full border px-4 shadow-sm ${query.near ? 'border-primary bg-primary' : 'border-border bg-card'}`}
              >
                {locating ? <ActivityIndicator color={palette.primary} /> : <Crosshair size={18} color={query.near ? palette['primary-foreground'] : palette.foreground} weight="bold" />}
                <Text className={`font-sans-semibold text-[15px] ${query.near ? 'text-primary-foreground' : 'text-foreground'}`}>{locating ? t('search.locating') : t('search.nearMe')}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => filters.current?.present()}
                className="h-11 flex-row items-center gap-2 rounded-full border border-border bg-card px-4 shadow-sm"
              >
                <FadersHorizontal size={18} color={palette.foreground} weight="bold" />
                <Text className="font-sans-semibold text-[15px] text-foreground">
                  {filterCount > 0 ? t('search.filtersWithCount', { count: filterCount }) : t('search.filters')}
                </Text>
              </Pressable>
            </View>
            {facets.data?.sports.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
                {facets.data.sports.map((sport) => {
                  const active = query.sport === sport.key;
                  return (
                    <Pressable
                      key={sport.key}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => update({ sport: active ? undefined : sport.key })}
                      className={`h-10 flex-row items-center gap-1.5 rounded-full border px-3.5 shadow-sm ${active ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                    >
                      <Text className={`font-sans-semibold text-sm ${active ? 'text-primary-foreground' : 'text-foreground'}`}>{sportName(sport.key)}</Text>
                      <Text className={`font-sans text-sm ${active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{sport.count}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
            {movedIn === fitKey ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void searchArea()}
                className="h-11 flex-row items-center gap-2 self-center rounded-full bg-night px-5 shadow-lg"
              >
                <MagnifyingGlass size={18} color={palette['night-foreground']} weight="bold" />
                <Text className="font-sans-semibold text-[15px] text-night-foreground">{t('search.searchThisArea')}</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      {selected ? <MapPreview id={selected} bottom={SHEET_COLLAPSED + 12} onClose={() => setSelection({ key: fitKey, id: null })} /> : null}

      <BottomSheet
        ref={sheet}
        index={1}
        snapPoints={[SHEET_COLLAPSED, '50%', '92%']}
        enableDynamicSizing={false}
        onChange={setSheetIndex}
        backgroundStyle={{ backgroundColor: palette.background }}
        handleIndicatorStyle={{ backgroundColor: palette['muted-foreground'] }}
      >
        <BottomSheetFlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 28 }}
          ListHeaderComponent={
            <View className="gap-1 pb-1">
              <Text accessibilityRole="header" className="font-display-italic text-[28px] leading-8 uppercase text-foreground" numberOfLines={2}>
                {heading}
              </Text>
              <Text accessibilityLiveRegion="polite" className="font-display text-sm tracking-[1.6px] uppercase text-muted-foreground">
                {list.isFetching && !list.isFetchingNextPage ? t('search.loadingResults') : t('search.results', { count: firstPage?.total ?? 0 })}
              </Text>
            </View>
          }
          ListEmptyComponent={
            list.isPending ? (
              <ActivityIndicator color={palette.primary} style={{ marginTop: 24 }} />
            ) : list.isError ? (
              <View className="gap-3 rounded-2xl border border-border bg-card p-5">
                <Text className="font-sans-semibold text-lg text-foreground">{t('search.errorTitle')}</Text>
                <Text className="font-sans text-base text-muted-foreground">{t('search.errorBody')}</Text>
                <Pressable accessibilityRole="button" onPress={() => void list.refetch()} className="self-start">
                  <Text className="font-sans-semibold text-base text-primary">{t('common.retry')}</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3 rounded-2xl border border-border bg-card p-5">
                <Text className="font-display-italic text-2xl uppercase text-foreground">{t('search.emptyTitle')}</Text>
                <Text className="font-sans text-base text-muted-foreground">{t('search.emptyBody')}</Text>
                <Pressable accessibilityRole="button" onPress={() => setQuery({})} className="self-start py-2">
                  <Text className="font-sans-semibold text-base text-primary">{t('search.clearFilters')}</Text>
                </Pressable>
              </View>
            )
          }
          renderItem={({ item }) => <ListingCard listing={item} />}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
          }}
          ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={palette.primary} /> : null}
        />
      </BottomSheet>

      <FiltersSheet
        ref={filters}
        query={query}
        onApply={(draft) => {
          filters.current?.dismiss();
          update(draft);
        }}
      />
    </View>
  );
}
