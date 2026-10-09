import { PHOTO_CREDITS } from '@juandavidfuentes/indomitox-shared';
import { motion } from '@juandavidfuentes/indomitox-shared/tokens';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { MagnifyingGlass, MapPin } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { Logo, Tape } from '@/components/brand';
import { PhotoShade } from '@/components/photo-shade';
import { PressableScale } from '@/components/pressable-scale';
import { TopoPattern } from '@/components/topo-pattern';
import { PHOTOS } from '@/lib/photos';
import { usePalette } from '@/lib/theme';

const HERO = 'hero-chicamocha-parapente';
/** Altura del corte diagonal inferior (misma pendiente de 2° que la web, aprox.). */
const CUT = 22;

const enter = (step: number) => FadeInDown.duration(motion.slow * 1.6).delay(step * motion.stagger * 2);

/** Hero "Noche" con la foto del Chicamocha: el parapentista queda arriba y el texto abajo. */
export function ExploreHero() {
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const credit = PHOTO_CREDITS[HERO];
  const [text, setText] = useState('');
  // El buscador abre el Mapa con el destino: la API reconoce si el texto es una zona o un municipio.
  const search = () => router.navigate({ pathname: '/mapa', params: text.trim() ? { q: text.trim() } : {} });

  return (
    <View className="overflow-hidden bg-night" style={{ paddingTop: insets.top + 10 }}>
      <Image
        source={PHOTOS[HERO]}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={{ left: '40%', top: '40%' }}
        accessible={false}
      />
      <PhotoShade
        stops={[
          { at: 0, color: palette.night, opacity: 0.7 },
          { at: 0.22, color: palette.night, opacity: 0.1 },
          { at: 0.42, color: palette.night, opacity: 0.35 },
          { at: 0.72, color: palette.night, opacity: 0.92 },
          { at: 1, color: palette.night, opacity: 0.97 },
        ]}
      />
      <TopoPattern color={palette.brand} opacity={0.24} />

      <View className="px-5">
        <Logo textClassName="text-night-foreground" />
      </View>

      <View className="gap-4 px-5 pt-56" style={{ paddingBottom: CUT + 34 }}>
        <Animated.View entering={enter(0)}>
          <Tape label={t('home.heroEyebrow')} />
        </Animated.View>
        <Animated.View entering={enter(1)}>
          <Text className="font-display-italic text-[44px] leading-[42px] uppercase text-night-foreground">
            {t('home.heroTitleLead')} <Text className="text-brand">{t('home.heroTitleHighlight')}</Text>
          </Text>
        </Animated.View>
        <Animated.View entering={enter(2)}>
          <Text className="font-sans text-base leading-6 text-night-foreground/90">{t('home.heroSubtitle')}</Text>
        </Animated.View>
        <Animated.View entering={enter(3)}>
          <View className="mt-1 flex-row items-center gap-2 rounded-2xl bg-card p-2">
            <MapPin size={20} color={palette['muted-foreground']} style={{ marginLeft: 8 }} />
            <TextInput
              accessibilityLabel={t('home.searchLabel')}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={palette['muted-foreground']}
              className="h-12 flex-1 font-sans text-base text-card-foreground"
              returnKeyType="search"
              value={text}
              onChangeText={setText}
              onSubmitEditing={search}
            />
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={t('home.searchButton')}
              onPress={search}
              className="h-12 w-12 items-center justify-center rounded-xl bg-primary"
            >
              <MagnifyingGlass size={22} color={palette['primary-foreground']} weight="bold" />
            </PressableScale>
          </View>
        </Animated.View>
        <Text className="self-end font-sans text-[11px] text-night-foreground/80">
          {t('common.photoCredit', { author: credit.author, license: credit.license })}
        </Text>
      </View>

      {/* Corte diagonal que sube hacia la derecha. */}
      <Svg
        width="100%"
        height={CUT}
        viewBox="0 0 100 10"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}
        pointerEvents="none"
      >
        <Polygon points="0,10.5 100,0 100,10.5" fill={palette.background} />
      </Svg>
    </View>
  );
}
