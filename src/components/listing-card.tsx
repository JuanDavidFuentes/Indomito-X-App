import type { Difficulty } from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { Tape } from '@/components/brand';
import { DifficultyBadge } from '@/components/difficulty';
import { PressableScale } from '@/components/pressable-scale';
import { useAuth } from '@/lib/auth';
import { usePalette } from '@/lib/theme';

export interface ListingCardProps {
  photo: ImageSourcePropType;
  sport: string;
  title: string;
  /** Zona y duración ya formateadas ("San Gil · 3 h"). */
  meta: string;
  difficulty: Difficulty;
  priceFrom: string;
  priceApprox?: string;
  /** Contenido de ejemplo (antes de F4): muestra la cinta "Ejemplo". */
  exampleLabel?: string;
  width: number;
}

/** Tarjeta de publicación (MASTER §7): foto 4:3, dificultad, favorito, deporte, título, zona y precio. */
export function ListingCard({
  photo,
  sport,
  title,
  meta,
  difficulty,
  priceFrom,
  priceApprox,
  exampleLabel,
  width,
}: ListingCardProps) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { status } = useAuth();
  // En F4 el favorito se guarda en la API; por ahora solo cambia en pantalla.
  const [saved, setSaved] = useState(false);
  // AUTH-07: sin sesión se pide la cuenta (modal) y al terminar se vuelve aquí.
  const onFavorite = () => (status === 'signedIn' ? setSaved((value) => !value) : router.push('/auth/ingresar'));

  return (
    <View style={{ width }} className="gap-1.5">
      <View className="overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: 4 / 3 }}>
        <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
        <View className="absolute top-2.5 left-2.5">
          <DifficultyBadge level={difficulty} />
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`${t('listing.addToFavorites')}: ${title}`}
          accessibilityState={{ selected: saved }}
          onPress={onFavorite}
          pressedScale={0.85}
          style={{ position: 'absolute', top: 4, right: 4 }}
          className="size-11 items-center justify-center rounded-full bg-night/45"
        >
          <Heart size={22} color={saved ? palette.brand : palette['night-foreground']} weight={saved ? 'fill' : 'bold'} />
        </PressableScale>
        {exampleLabel ? (
          <View className="absolute bottom-3 left-2.5">
            <Tape label={exampleLabel} small />
          </View>
        ) : null}
      </View>
      <Text className="mt-1 font-display text-[13px] tracking-[1.8px] uppercase text-secondary">{sport}</Text>
      <Text className="font-display text-xl leading-6 uppercase text-foreground" numberOfLines={2}>
        {title}
      </Text>
      <Text className="font-sans text-sm text-muted-foreground">{meta}</Text>
      <Text className="font-sans text-[15px] text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
        <Text className="font-sans-semibold">{t('price.from', { price: priceFrom })}</Text>
        {priceApprox ? <Text className="text-muted-foreground"> {t('price.approx', { price: priceApprox })}</Text> : null}
      </Text>
    </View>
  );
}
