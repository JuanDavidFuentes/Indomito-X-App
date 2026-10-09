import { durationText, localizedOr, type Locale, type MessageTranslator } from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { X } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { DifficultyBadge } from '@/components/difficulty';
import { openListing } from '@/components/listing-card';
import { useListingCard, usePrice } from '@/lib/explore';
import { photoUrl } from '@/lib/listings';
import { usePalette } from '@/lib/theme';

/** Tarjeta resumen del pin seleccionado (MASTER §7), sobre la hoja de resultados. */
export function MapPreview({ id, bottom, onClose }: { id: string; bottom: number; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const palette = usePalette();
  const card = useListingCard(id);
  const price = usePrice();
  const listing = card.data;

  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(140)} style={{ position: 'absolute', left: 16, right: 16, bottom, zIndex: 5 }}>
      <View className="flex-row overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        {!listing ? (
          <View className="h-28 flex-1 items-center justify-center">
            <ActivityIndicator color={palette.primary} />
          </View>
        ) : (
          <Pressable accessibilityRole="link" onPress={() => openListing(listing)} className="flex-1 flex-row active:opacity-90">
            <View className="w-28 bg-muted">
              {photoUrl(listing.cover, 320) ? (
                <Image source={{ uri: photoUrl(listing.cover, 320)! }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessible={false} />
              ) : null}
            </View>
            <View className="flex-1 justify-center gap-1 p-3 pr-12">
              <Text className="font-display text-xl leading-6 uppercase text-foreground" numberOfLines={2}>
                {localizedOr(listing.title, locale, listing.slug)}
              </Text>
              <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
                {[listing.municipality?.name, durationText(t as unknown as MessageTranslator, listing)].filter(Boolean).join(' · ')}
              </Text>
              <Text className="font-sans-semibold text-[15px] text-foreground">{t('price.from', { price: price(listing.priceFromMinor).cop })}</Text>
              {listing.difficulty ? <DifficultyBadge level={listing.difficulty} /> : null}
            </View>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.closePreview')}
          onPress={onClose}
          className="absolute top-1 right-1 size-11 items-center justify-center rounded-full"
        >
          <X size={18} color={palette['muted-foreground']} weight="bold" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
