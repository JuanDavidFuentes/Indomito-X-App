import { HOME_DESTINATIONS, type HomeDestinationId } from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { PhotoShade } from '@/components/photo-shade';
import { PHOTOS } from '@/lib/photos';
import { usePalette } from '@/lib/theme';

/** Cuadrícula tipo bento: Chicamocha a lo ancho, San Gil y Barichara lado a lado, Curití a lo ancho. */
const HEIGHT: Record<HomeDestinationId, number> = { chicamocha: 200, sanGil: 150, barichara: 150, curiti: 150 };

export function Destinations() {
  const { t } = useTranslation();
  const palette = usePalette();
  const [chicamocha, sanGil, barichara, curiti] = HOME_DESTINATIONS;

  const card = (destination: (typeof HOME_DESTINATIONS)[number], flex?: boolean) => (
    <View
      key={destination.id}
      className="overflow-hidden rounded-2xl"
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
      <View className="flex-1 justify-end p-4">
        <Text className="font-display-italic text-[28px] leading-[28px] uppercase text-night-foreground">
          {destination.name}
        </Text>
        <Text className="mt-1 font-sans-medium text-sm text-night-foreground/90">
          {t(`home.destinations.${destination.id}`)}
        </Text>
      </View>
    </View>
  );

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
