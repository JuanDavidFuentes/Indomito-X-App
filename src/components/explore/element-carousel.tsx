import { ELEMENT_PHOTOS, SPORT_ELEMENTS, type SportElement } from '@juandavidfuentes/indomitox-shared';
import { elementTints, motion } from '@juandavidfuentes/indomitox-shared/tokens';
import { Image } from 'expo-image';
import { Flashlight, Lightning, Mountains, Waves, Wind, type IconProps } from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { PhotoShade } from '@/components/photo-shade';
import { PHOTOS } from '@/lib/photos';
import { usePalette } from '@/lib/theme';

const ICONS: Record<SportElement, ComponentType<IconProps>> = {
  WATER: Waves,
  AIR: Wind,
  LAND: Mountains,
  UNDERGROUND: Flashlight,
  PARK: Lightning,
};

const CARD_WIDTH = 150;
const GAP = 12;

/** Carrusel horizontal de elementos con foto y tinte (Río, Sol, Lava, Noche, Adrenalina). */
export function ElementCarousel() {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + GAP}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 20, gap: GAP }}
    >
      {SPORT_ELEMENTS.map((element, index) => {
        const Icon = ICONS[element];
        const tint = palette[elementTints[element]];
        return (
          <Animated.View
            key={element}
            entering={FadeInRight.duration(motion.slow * 1.6).delay(index * motion.stagger * 2)}
            style={{ width: CARD_WIDTH, height: 206 }}
          >
            <View className="flex-1 overflow-hidden rounded-2xl border border-border">
              <Image
                source={PHOTOS[ELEMENT_PHOTOS[element]]}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                accessible={false}
              />
              <PhotoShade
                stops={[
                  { at: 0.2, color: tint, opacity: 0 },
                  { at: 0.95, color: tint, opacity: 0.96 },
                ]}
              />
              <View className="flex-1 justify-between p-3">
                <View className="size-9 items-center justify-center rounded-xl" style={{ backgroundColor: tint }}>
                  <Icon size={20} color={palette['night-foreground']} weight="bold" />
                </View>
                <View>
                  <Text
                    className="font-display-italic text-2xl uppercase text-night-foreground"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {t(`elements.${element}`)}
                  </Text>
                  <Text className="mt-0.5 font-sans-medium text-xs leading-4 text-night-foreground">
                    {t(`home.elementExamples.${element}`)}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}
