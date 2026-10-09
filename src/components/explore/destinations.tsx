import { HOME_DESTINATIONS, localizedOr, type HomeDestinationId, type Locale } from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tape } from '@/components/brand';
import { PhotoShade } from '@/components/photo-shade';
import { usePlaces } from '@/lib/explore';
import { PHOTOS } from '@/lib/photos';
import { usePalette } from '@/lib/theme';

/** Cuadrícula tipo bento: Chicamocha a lo ancho, San Gil y Barichara lado a lado, Curití a lo ancho. */
const HEIGHT: Record<HomeDestinationId, number> = { chicamocha: 200, sanGil: 150, barichara: 150, curiti: 150 };

/** Destinos de Santander: cada uno es una zona con sus aventuras; al tocarlo abre el Mapa filtrado. */
export function Destinations() {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const places = usePlaces('');
  const zones = new Map((places.data ?? []).map((place) => [place.slug, place]));
  const [chicamocha, sanGil, barichara, curiti] = HOME_DESTINATIONS;

  const card = (destination: (typeof HOME_DESTINATIONS)[number], flex?: boolean) => {
    const zone = zones.get(destination.zoneSlug);
    const name = zone ? localizedOr(zone.names, i18n.language as Locale, destination.name) : destination.name;
    return (
    <Pressable
      key={destination.id}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${t(`home.destinations.${destination.id}`)}${zone ? `. ${t('home.destinationCount', { count: zone.listingCount })}` : ''}`}
      onPress={() => router.navigate({ pathname: '/mapa', params: zone ? { place: zone.slug } : { q: destination.name } })}
      className="overflow-hidden rounded-2xl active:opacity-90"
      style={{ height: HEIGHT[destination.id], flex: flex ? 1 : undefined }}
    >
      <Image source={PHOTOS[destination.photo]} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
      <PhotoShade
        stops={[
          { at: 0.15, color: palette.night, opacity: 0 },
          { at: 0.55, color: palette.night, opacity: 0.55 },
          { at: 1, color: palette.night, opacity: 0.94 },
        ]}
      />
      {zone ? (
        <View className="absolute top-3 left-3">
          <Tape label={t('home.destinationCount', { count: zone.listingCount })} small />
        </View>
      ) : null}
      <View className="flex-1 justify-end p-4">
        <Text className="font-display-italic text-[28px] leading-[28px] uppercase text-night-foreground">
          {name}
        </Text>
        <Text className="mt-1 font-sans-medium text-sm text-night-foreground/90">
          {t(`home.destinations.${destination.id}`)}
        </Text>
      </View>
    </Pressable>
    );
  };

  return (
    <View className="gap-3 px-5">
      {card(chicamocha)}
      <View className="flex-row gap-3">
        {card(sanGil, true)}
        {card(barichara, true)}
      </View>
      {card(curiti)}
    </View>
  );
}
