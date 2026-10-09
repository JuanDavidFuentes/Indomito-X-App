import {
  durationText,
  isServiceListing,
  listingWebPath,
  localDate,
  localizedOr,
  mapsUrl,
  pickLocalized,
  textLines,
  type Locale,
  type LocalizedText,
  type MessageTranslator,
  type PublicListingDetail,
  type PublicSlot,
} from '@juandavidfuentes/indomitox-shared';
import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Backpack,
  CalendarBlank,
  CalendarCheck,
  Check,
  Clock,
  Heart,
  Info,
  MapPin,
  NavigationArrow,
  SealCheck,
  ShareNetwork,
  ShieldCheck,
  Translate,
  Users,
  Warning,
  X,
  type IconProps,
} from 'phosphor-react-native';
import { useState, type ComponentType, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Linking, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DifficultyBadge, DifficultyShape } from '@/components/difficulty';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { PressableScale } from '@/components/pressable-scale';
import { TopoPattern } from '@/components/topo-pattern';
import { Button } from '@/components/ui/button';
import { useSports } from '@/lib/account';
import { useListingDetail, usePrice } from '@/lib/explore';
import { openOnWeb } from '@/lib/host';
import { formatInstant, photoUrl } from '@/lib/listings';
import { mediaUrl } from '@/lib/api';
import { useColorTheme, usePalette } from '@/lib/theme';
import { useFavorite } from '@/lib/wishlists';

/** Dominio público de los enlaces que se comparten (abren la app si está instalada, EXP-04). */
const SHARE_URL = (process.env.EXPO_PUBLIC_SHARE_URL ?? 'https://indomitox.co').replace(/\/+$/, '');
const MAP_STYLES = { light: 'https://tiles.openfreemap.org/styles/liberty', dark: 'https://tiles.openfreemap.org/styles/dark' } as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-display-italic text-[26px] leading-7 uppercase text-foreground">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Lines({ text, locale, icon: Icon, color }: { text: LocalizedText; locale: Locale; icon: ComponentType<IconProps>; color: string }) {
  const lines = textLines(pickLocalized(text, locale)?.text);
  return (
    <View className="gap-2">
      {lines.map((line) => (
        <View key={line} className="flex-row items-start gap-2.5">
          <Icon size={20} color={color} weight="bold" style={{ marginTop: 2 }} />
          <Text className="flex-1 font-sans text-base text-foreground">{line}</Text>
        </View>
      ))}
    </View>
  );
}

function OriginalNote({ text, locale }: { text: LocalizedText; locale: Locale }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const picked = pickLocalized(text, locale);
  if (!picked || picked.locale === locale) return null;
  return (
    <View className="flex-row items-center gap-2">
      <Translate size={16} color={palette['muted-foreground']} />
      <Text className="font-sans text-sm text-muted-foreground">{t(`guide.originalIn.${picked.locale}`)}</Text>
    </View>
  );
}

/** Salidas con cupo agrupadas por día (hora de Bogotá). */
function Departures({ slots, locale }: { slots: PublicSlot[]; locale: Locale }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const [all, setAll] = useState(false);
  const days: [string, PublicSlot[]][] = [];
  for (const slot of slots) {
    const day = localDate(slot.startsAt);
    const last = days.at(-1);
    if (last && last[0] === day) last[1].push(slot);
    else days.push([day, [slot]]);
  }
  if (!days.length) return <Text className="font-sans text-base text-muted-foreground">{t('listingDetail.upcomingEmpty')}</Text>;
  return (
    <View className="gap-2">
      {(all ? days : days.slice(0, 5)).map(([day, daySlots]) => (
        <View key={day} className="flex-row items-start gap-3 rounded-xl border border-border bg-card p-3.5">
          <CalendarBlank size={22} color={palette.secondary} />
          <View className="flex-1 gap-1">
            <Text className="font-sans-semibold text-base text-foreground">
              {formatInstant(daySlots[0]!.startsAt, locale, { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            {daySlots.map((slot) => (
              <Text key={slot.id} className="font-sans text-sm text-muted-foreground">
                <Text className="font-sans-semibold text-foreground">{formatInstant(slot.startsAt, locale, { hour: 'numeric', minute: '2-digit' })}</Text>
                {'  '}
                {t('listingDetail.spotsLeft', { count: slot.remaining })}
              </Text>
            ))}
          </View>
        </View>
      ))}
      {days.length > 5 ? (
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: all }} onPress={() => setAll((value) => !value)} className="min-h-11 justify-center self-start">
          <Text className="font-sans-semibold text-base text-primary">{all ? t('listingDetail.showFewerDates') : t('listingDetail.showMoreDates')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Detail({ listing }: { listing: PublicListingDetail }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;
  const palette = usePalette();
  const scheme = useColorTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data: sports } = useSports();
  // Al pasar la galería, la barra de estado recibe un fondo (como en Explorar).
  const [pastGallery, setPastGallery] = useState(false);
  const price = usePrice()(listing.priceFromMinor);
  const [photo, setPhoto] = useState(0);
  const title = localizedOr(listing.title, locale, listing.slug);
  const favorite = useFavorite(listing.id, title);
  const service = isServiceListing(listing.type);
  const tt = t as unknown as MessageTranslator;
  const sportName = (key: string) => localizedOr(sports?.find((sport) => sport.key === key)?.names, locale, t(`sports.${key}`, { defaultValue: key }));
  const place = listing.municipality ? `${listing.municipality.name}, ${listing.municipality.departmentName}` : null;
  const about = pickLocalized(listing.description, locale);
  const medical = pickLocalized(listing.medicalRestrictions, locale);

  const share = () =>
    void Share.share({ title, message: `${t('listingDetail.shareText', { title })}\n${SHARE_URL}${listingWebPath(listing.path, locale)}` });

  const facts: { label: string; value: string; icon: ReactNode }[] = [
    ...(service ? [{ label: t('listingDetail.duration'), value: durationText(tt, listing), icon: <Clock size={20} color={palette.brand} /> }] : []),
    ...(listing.difficulty ? [{ label: t('listingDetail.difficulty'), value: t(`difficulty.${listing.difficulty}`), icon: <DifficultyShape level={listing.difficulty} size={14} /> }] : []),
    ...(service && listing.languages.length
      ? [{ label: t('listingDetail.languages'), value: listing.languages.map((language) => t(`spokenLanguages.${language}`)).join(', '), icon: <Translate size={20} color={palette.brand} /> }]
      : []),
    ...(place ? [{ label: t('listingDetail.location'), value: place, icon: <MapPin size={20} color={palette.brand} /> }] : []),
    ...(listing.minAge ? [{ label: t('listingDetail.requirements'), value: t('listingDetail.minAge', { age: listing.minAge }), icon: <Users size={20} color={palette.brand} /> }] : []),
  ];

  const roundButton = 'size-11 items-center justify-center rounded-full bg-night/55';

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar style={pastGallery && scheme === 'light' ? 'dark' : 'light'} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        scrollEventThrottle={32}
        onScroll={(event) => {
          const past = event.nativeEvent.contentOffset.y > width * 0.78 - insets.top - 12;
          if (past !== pastGallery) setPastGallery(past);
        }}
      >
        {/* Galería */}
        <View style={{ height: width * 0.78 }} className="bg-muted">
          <FlatList
            data={listing.photos}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => setPhoto(Math.round(event.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index }) => (
              <Image
                source={{ uri: photoUrl(item, 1280) ?? undefined }}
                placeholder={item.placeholder ? { uri: item.placeholder } : undefined}
                style={{ width, height: width * 0.78 }}
                contentFit="cover"
                transition={150}
                accessibilityLabel={t('listingDetail.photoAlt', { title, index: index + 1, total: listing.photos.length })}
              />
            )}
          />
          <View className="absolute inset-x-0 flex-row items-center justify-between px-4" style={{ top: insets.top + 6 }}>
            <PressableScale accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} className={roundButton}>
              <ArrowLeft size={22} color={palette['night-foreground']} weight="bold" />
            </PressableScale>
            <View className="flex-row gap-2">
              <PressableScale accessibilityRole="button" accessibilityLabel={t('listingDetail.share')} onPress={share} className={roundButton}>
                <ShareNetwork size={22} color={palette['night-foreground']} weight="bold" />
              </PressableScale>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={favorite.saved ? t('listing.removeFromFavorites') : t('listing.addToFavorites')}
                accessibilityState={{ selected: favorite.saved }}
                onPress={favorite.toggle}
                pressedScale={0.85}
                className={roundButton}
              >
                <Heart size={22} color={favorite.saved ? palette.brand : palette['night-foreground']} weight={favorite.saved ? 'fill' : 'bold'} />
              </PressableScale>
            </View>
          </View>
          {listing.photos.length > 1 ? (
            <View className="absolute right-4 bottom-3 rounded-full bg-night/65 px-2.5 py-1">
              <Text className="font-sans-semibold text-xs text-night-foreground">
                {photo + 1} / {listing.photos.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-9 px-5 pt-5">
          <View className="gap-2">
            <Text className="font-display text-[13px] tracking-[1.8px] uppercase text-secondary">
              {[...listing.sportKeys.map(sportName), t(`listingType.${listing.type}`)].join(' · ')}
            </Text>
            <Text accessibilityRole="header" className="font-display-italic text-[38px] leading-[38px] uppercase text-foreground">
              {title}
            </Text>
            <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
              {place ? (
                <View className="flex-row items-center gap-1.5">
                  <MapPin size={16} color={palette.brand} weight="fill" />
                  <Text className="font-sans text-sm text-muted-foreground">{place}</Text>
                </View>
              ) : null}
              {listing.difficulty ? <DifficultyBadge level={listing.difficulty} /> : null}
            </View>
          </View>

          {about ? (
            <Section title={service ? t('listingDetail.about') : t('listingDetail.aboutProduct')}>
              <Text className="font-sans text-base leading-6 text-foreground">{about.text}</Text>
              <OriginalNote text={listing.description} locale={locale} />
            </Section>
          ) : null}

          {facts.length ? (
            <View className="overflow-hidden rounded-2xl bg-night p-5 dark:border dark:border-border">
              <TopoPattern color={palette.brand} opacity={0.22} />
              <Text className="font-display text-xs tracking-[2.4px] uppercase text-night-foreground">{t('listingDetail.facts')}</Text>
              <View className="mt-4 gap-4">
                {facts.map((fact) => (
                  <View key={fact.label} className="flex-row items-start gap-3">
                    <View style={{ marginTop: 2 }}>{fact.icon}</View>
                    <View className="flex-1">
                      <Text className="font-display text-[11px] tracking-[1.8px] uppercase text-night-foreground/75">{fact.label}</Text>
                      <Text className="font-sans-semibold text-base text-night-foreground">{fact.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {pickLocalized(listing.includes, locale) ? (
            <Section title={t('listingDetail.includes')}>
              <Lines text={listing.includes} locale={locale} icon={Check} color={palette.success} />
            </Section>
          ) : null}
          {pickLocalized(listing.excludes, locale) ? (
            <Section title={t('listingDetail.excludes')}>
              <Lines text={listing.excludes} locale={locale} icon={X} color={palette['muted-foreground']} />
            </Section>
          ) : null}
          {pickLocalized(listing.whatToBring, locale) ? (
            <Section title={t('listingDetail.whatToBring')}>
              <Lines text={listing.whatToBring} locale={locale} icon={Backpack} color={palette.secondary} />
            </Section>
          ) : null}

          {service ? (
            <Section title={t('listingDetail.requirements')}>
              <View className="gap-2">
                {listing.minWeightKg && listing.maxWeightKg ? (
                  <Text className="font-sans text-base text-foreground">{t('listingDetail.weightRange', { min: listing.minWeightKg, max: listing.maxWeightKg })}</Text>
                ) : null}
                {listing.fitnessLevel ? (
                  <Text className="font-sans text-base text-foreground">{t('listingDetail.fitness', { level: t(`fitnessLevel.${listing.fitnessLevel}`) })}</Text>
                ) : null}
                <Text className="font-sans text-base text-foreground">{listing.mustSwim ? t('listingDetail.mustSwim') : t('listingDetail.noSwim')}</Text>
                {medical ? (
                  <View className="mt-1 flex-row items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3.5">
                    <Warning size={20} color={palette.warning} />
                    <View className="flex-1">
                      <Text className="font-sans-semibold text-base text-foreground">{t('listingDetail.medical')}</Text>
                      <Text className="font-sans text-base text-foreground">{medical.text}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </Section>
          ) : null}

          {listing.meetingPoint ? (
            <Section title={service ? t('listingDetail.meetingPoint') : t('listingDetail.pickupPoint')}>
              <View className="h-48 overflow-hidden rounded-xl border border-border" accessible accessibilityLabel={t('listingDetail.meetingMap')}>
                <Map style={{ flex: 1 }} mapStyle={MAP_STYLES[scheme === 'dark' ? 'dark' : 'light']} dragPan={false} touchZoom={false} doubleTapZoom={false} touchRotate={false} touchPitch={false} logo={false} compass={false}>
                  <Camera initialViewState={{ center: [listing.meetingPoint.lng, listing.meetingPoint.lat], zoom: 13.5 }} />
                  <GeoJSONSource id="punto" data={{ type: 'Point', coordinates: [listing.meetingPoint.lng, listing.meetingPoint.lat] }}>
                    <Layer type="circle" id="punto" paint={{ 'circle-color': palette.primary, 'circle-radius': 11, 'circle-stroke-color': palette.background, 'circle-stroke-width': 4 }} />
                  </GeoJSONSource>
                </Map>
              </View>
              {listing.address ? <Text className="font-sans-semibold text-base text-foreground">{listing.address}</Text> : null}
              {pickLocalized(listing.meetingNotes, locale) ? (
                <Text className="font-sans text-base text-muted-foreground">{pickLocalized(listing.meetingNotes, locale)!.text}</Text>
              ) : null}
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(mapsUrl(listing.meetingPoint!))} className="min-h-11 flex-row items-center gap-2 self-start">
                <NavigationArrow size={18} color={palette.primary} />
                <Text className="font-sans-semibold text-base text-primary">{t('listingDetail.openInMaps')}</Text>
              </Pressable>
            </Section>
          ) : null}

          {listing.type === 'EXPERIENCE' || listing.type === 'COURSE' || listing.type === 'PACKAGE' ? (
            <Section title={t('listingDetail.upcoming')}>
              <Text className="font-sans text-sm text-muted-foreground">{t('listingDetail.upcomingHint')}</Text>
              <Departures slots={listing.upcoming} locale={locale} />
            </Section>
          ) : null}

          {listing.type === 'RENTAL' && listing.openingHours.length ? (
            <Section title={t('listingDetail.openingHours')}>
              {listing.openingHours.map((hours) => (
                <Text key={`${hours.weekdays.join()}-${hours.opensAt}`} className="font-sans text-base text-foreground">
                  <Text className="font-sans-semibold">{hours.weekdays.map((day) => t(`weekdaysShort.${day}`)).join(', ')}</Text> {hours.opensAt} – {hours.closesAt}
                </Text>
              ))}
            </Section>
          ) : null}

          {listing.type === 'PRODUCT' && listing.variants.length ? (
            <Section title={t('listingDetail.variants')}>
              <View className="flex-row flex-wrap gap-2">
                {listing.variants.map((variant) => (
                  <View key={variant.id} className={`rounded-xl border-2 px-3.5 py-2 ${variant.inStock ? 'border-border' : 'border-dashed border-border'}`}>
                    <Text className={`font-sans-semibold text-base ${variant.inStock ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {[variant.size, variant.color].filter(Boolean).join(' · ')}
                    </Text>
                    <Text className="font-sans text-sm text-muted-foreground">
                      {!variant.inStock ? t('listingDetail.outOfStock') : variant.lowStock ? t('listingDetail.lowStock', { count: variant.lowStock }) : ' '}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          <Section title={t('listingDetail.policy')}>
            <Text className="font-sans-semibold text-base text-foreground">{t(`cancellationPolicy.${listing.cancellationPolicy}`)}</Text>
            <Text className="font-sans text-base text-muted-foreground">{t(`cancellationPolicyHint.${listing.cancellationPolicy}`)}</Text>
          </Section>

          <Section title={t('listingDetail.payment')}>
            {listing.paymentModes.map((mode) => (
              <View key={mode} className="gap-0.5">
                <Text className="font-sans-semibold text-base text-foreground">{t(`paymentMode.${mode}`)}</Text>
                <Text className="font-sans text-base text-muted-foreground">{t(`listingDetail.paymentHint.${mode}`)}</Text>
              </View>
            ))}
          </Section>

          <Section title={t('listingDetail.host')}>
            <View className="gap-3 rounded-2xl border border-border bg-card p-4">
              <View className="flex-row items-center gap-3">
                <View className="size-14 overflow-hidden rounded-full bg-night">
                  {listing.host.logoUrl ? <Image source={{ uri: mediaUrl(listing.host.logoUrl)! }} style={{ width: '100%', height: '100%' }} accessible={false} /> : null}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <SealCheck size={16} color={palette.success} weight="fill" />
                    <Text className="font-sans-semibold text-sm text-success">{t('guide.verified')}</Text>
                  </View>
                  <Text className="font-display-italic text-2xl uppercase text-foreground" numberOfLines={2}>
                    {listing.host.name}
                  </Text>
                </View>
              </View>
              {listing.host.rntNumber ? (
                <View className="flex-row items-center gap-2 rounded-xl border-2 border-secondary/50 px-3 py-2">
                  <ShieldCheck size={20} color={palette.secondary} weight="duotone" />
                  <View className="flex-1">
                    <Text className="font-display text-lg tracking-[1px] text-foreground">{t('guide.rnt', { number: listing.host.rntNumber })}</Text>
                    <Text className="font-sans text-xs text-muted-foreground">{t('listingDetail.rntNotice')}</Text>
                  </View>
                </View>
              ) : null}
              <Pressable accessibilityRole="link" onPress={() => openOnWeb(locale, '/guias/[slug]', { slug: listing.host.slug })} className="min-h-11 justify-center self-start">
                <Text className="font-sans-semibold text-base text-primary">{t('listingDetail.viewHost')}</Text>
              </Pressable>
            </View>
          </Section>
        </View>
      </ScrollView>

      {pastGallery ? <View className="absolute inset-x-0 top-0 border-b border-border bg-background" style={{ height: insets.top }} pointerEvents="none" /> : null}

      {/* Barra inferior: precio y reserva (F5) */}
      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="font-sans text-xs text-muted-foreground">{t('listingDetail.priceFrom')}</Text>
            <Text className="font-sans-semibold text-xl text-foreground" style={{ fontVariant: ['tabular-nums'] }}>
              {price.cop}
              {price.approx ? <Text className="font-sans text-sm text-muted-foreground"> {t('price.approx', { price: price.approx })}</Text> : null}
            </Text>
            <Text className="font-sans text-xs text-muted-foreground">{t(`priceUnit.${listing.priceUnit}`)}</Text>
          </View>
          <Button label={t('listingDetail.book')} icon={CalendarCheck} disabled accessibilityHint={t('listingDetail.bookSoon')} className="px-4" />
        </View>
        <View className="mt-1.5 flex-row items-center gap-1.5">
          <Info size={14} color={palette['muted-foreground']} />
          <Text className="flex-1 font-sans text-xs text-muted-foreground">{t('common.comingSoon')} · {t('listingDetail.chargedInCop')}</Text>
        </View>
      </View>
    </View>
  );
}

/** Detalle de una publicación (LIST-05, LIST-07). Llega desde las tarjetas, el mapa o un enlace compartido. */
export default function ListingScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const detail = useListingDetail(slug);

  if (detail.data) return <Detail listing={detail.data} />;
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background px-8" style={{ paddingTop: insets.top }}>
      <FocusAwareStatusBar style="auto" />
      {detail.isPending ? (
        <ActivityIndicator color={palette.primary} size="large" />
      ) : (
        <>
          <Text className="self-stretch text-center font-display-italic text-3xl uppercase text-foreground">{t('listingDetail.notFoundTitle')}</Text>
          <Text className="self-stretch text-center font-sans text-base text-muted-foreground">{t('listingDetail.notFoundBody')}</Text>
          <Button label={t('common.back')} variant="outline" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </>
      )}
    </View>
  );
}
