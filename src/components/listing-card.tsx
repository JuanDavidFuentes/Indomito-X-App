import { durationText, localizedOr, type ListingCardDto, type Locale, type MessageTranslator } from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, Star } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DifficultyBadge } from '@/components/difficulty';
import { PressableScale } from '@/components/pressable-scale';
import { useSports } from '@/lib/account';
import { usePrice } from '@/lib/explore';
import { mediaUrl } from '@/lib/api';
import { photoUrl } from '@/lib/listings';
import { usePalette } from '@/lib/theme';
import { useFavorite } from '@/lib/wishlists';

export interface ListingCardProps {
  listing: ListingCardDto;
  /** Ancho fijo en los carruseles; sin él, ocupa el ancho disponible. */
  width?: number;
}

/** Abre el detalle de una publicación. */
export function openListing(listing: Pick<ListingCardDto, 'slug'>): void {
  router.push({ pathname: '/listing/[slug]', params: { slug: listing.slug } });
}

/** Tarjeta de publicación (MASTER §7): foto 4:3, dificultad, favorito, deporte, título, lugar y precio. */
export function ListingCard({ listing, width }: ListingCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const palette = usePalette();
  const price = usePrice()(listing.priceFromMinor);
  const { data: sports } = useSports();
  const title = localizedOr(listing.title, locale, listing.slug);
  const favorite = useFavorite(listing.id, title);
  const sportKey = listing.sportKeys[0];
  const sport = sportKey ? localizedOr(sports?.find((item) => item.key === sportKey)?.names, locale, t(`sports.${sportKey}`, { defaultValue: sportKey })) : t(`listingType.${listing.type}`);
  const meta = [listing.municipality?.name, durationText(t as unknown as MessageTranslator, listing)].filter(Boolean).join(' · ');
  const cover = photoUrl(listing.cover, 640);

  return (
    <View style={width ? { width } : undefined} className="gap-1.5">
      <Pressable
        onPress={() => openListing(listing)}
        accessibilityRole="link"
        accessibilityLabel={`${title}. ${meta}. ${t('price.from', { price: price.cop })}`}
        className="gap-1.5 active:opacity-90"
      >
        <View className="overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: 4 / 3 }}>
          {cover ? (
            <Image
              source={{ uri: cover }}
              placeholder={listing.cover?.placeholder ? { uri: mediaUrl(listing.cover.placeholder) ?? listing.cover.placeholder } : undefined}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={150}
              accessible={false}
            />
          ) : null}
          {listing.difficulty ? (
            <View className="absolute top-2.5 left-2.5">
              <DifficultyBadge level={listing.difficulty} />
            </View>
          ) : null}
        </View>
        <Text className="mt-1 font-display text-[13px] tracking-[1.8px] uppercase text-secondary">{sport}</Text>
        <Text className="font-display text-xl leading-6 uppercase text-foreground" numberOfLines={2}>
          {title}
        </Text>
        <Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
          {meta}
        </Text>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 font-sans text-[15px] text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
            <Text className="font-sans-semibold">{t('price.from', { price: price.cop })}</Text>
            {price.approx ? <Text className="text-muted-foreground"> {t('price.approx', { price: price.approx })}</Text> : null}
          </Text>
          {listing.rating ? (
            <View className="flex-row items-center gap-1" accessible accessibilityLabel={t('listing.rating', { rating: listing.rating.average, count: listing.rating.count })}>
              <Star size={15} color={palette.accent} weight="fill" />
              <Text className="font-sans-semibold text-sm text-foreground">{listing.rating.average}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${favorite.saved ? t('listing.removeFromFavorites') : t('listing.addToFavorites')}: ${title}`}
        accessibilityState={{ selected: favorite.saved, busy: favorite.busy }}
        onPress={favorite.toggle}
        pressedScale={0.85}
        style={{ position: 'absolute', top: 4, right: 4 }}
        className="size-11 items-center justify-center rounded-full bg-night/45"
      >
        <Heart size={22} color={favorite.saved ? palette.brand : palette['night-foreground']} weight={favorite.saved ? 'fill' : 'bold'} />
      </PressableScale>
    </View>
  );
}
