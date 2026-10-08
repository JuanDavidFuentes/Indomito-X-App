import {
  availableListingActions,
  usesSlots,
  type HostListingSummary,
  type ListingHostAction,
  type ListingType,
  type Locale,
} from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import {
  Backpack,
  CaretRight,
  ChalkboardTeacher,
  Compass,
  SuitcaseRolling,
  TShirt,
  type IconProps,
} from 'phosphor-react-native';
import { useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { useErrorText } from '@/lib/forms';
import {
  formatInstant,
  MOBILE_LISTING_ACTIONS,
  photoUrl,
  transitionListing,
  useListingTitle,
  usePriceLabel,
  useStoreListing,
} from '@/lib/listings';
import { usePalette } from '@/lib/theme';
import { ListingStatusChip, ListingVisibilityNote } from './status-chip';

/** Ícono de cada tipo de publicación (decorativo: el nombre va siempre al lado). */
export const LISTING_TYPE_ICONS: Record<ListingType, ComponentType<IconProps>> = {
  EXPERIENCE: Compass,
  RENTAL: Backpack,
  COURSE: ChalkboardTeacher,
  PACKAGE: SuitcaseRolling,
  PRODUCT: TShirt,
};

/** La acción rápida de la tarjeta: pausar, reanudar, publicar (si está lista) o retirar de la revisión. */
export function quickAction(status: HostListingSummary['status'], readyToPublish: boolean): ListingHostAction | null {
  const actions = availableListingActions(status).filter((action) =>
    (MOBILE_LISTING_ACTIONS as readonly ListingHostAction[]).includes(action),
  );
  return actions.find((action) => action !== 'PUBLISH' || readyToPublish) ?? null;
}

/** Mensaje tras una acción (publicar con aprobación previa la manda a revisión). */
export function actionDoneKey(action: ListingHostAction, status: HostListingSummary['status']): string {
  return action === 'PUBLISH' && status === 'IN_MODERATION' ? 'listings.actionDone.SUBMITTED' : `listings.actionDone.${action}`;
}

/**
 * Tarjeta de una publicación en el panel móvil: abre el detalle y trae su acción rápida, así
 * pausar o reanudar desde el panel toma dos toques (MOB-03).
 */
export function ListingRow({ item }: { item: HostListingSummary }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const title = useListingTitle()(item.title);
  const priceLabel = usePriceLabel();
  const storeListing = useStoreListing();
  const locale = i18n.language as Locale;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const action = quickAction(item.status, item.readyToPublish);
  const TypeIcon = LISTING_TYPE_ICONS[item.type];
  const cover = photoUrl(item.cover, 320);

  const run = async () => {
    if (!action) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await transitionListing(item.id, action);
      storeListing(result);
      setMessage({ text: t(actionDoneKey(action, result.listing.status)), error: false });
    } catch (error) {
      setMessage({ text: errors.api(error), error: true });
    } finally {
      setBusy(false);
    }
  };

  const availability =
    item.type === 'PRODUCT'
      ? t('listings.stockTotal', { count: item.totalStock ?? 0 })
      : !usesSlots(item.type)
        ? t('listings.rentalAvailability')
        : item.nextSlotAt
          ? t('listings.nextSlot', {
              date: formatInstant(item.nextSlotAt, locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
              count: item.upcomingSlotCount,
            })
          : t('listings.noSlots');

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <PressableScale
        pressedScale={0.98}
        onPress={() => router.push({ pathname: '/panel/publicaciones/[id]', params: { id: item.id } } as Href)}
        accessibilityRole="button"
        accessibilityLabel={t('hostApp.openListing', { title })}
        className="flex-row items-center gap-3 p-3"
      >
        <View className="h-[72px] w-24 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {cover ? (
            <Image
              source={{ uri: cover }}
              placeholder={item.cover?.placeholder ? { uri: item.cover.placeholder } : undefined}
              style={{ width: 96, height: 72 }}
              contentFit="cover"
              accessible={false}
            />
          ) : (
            <TypeIcon size={28} color={palette['muted-foreground']} weight="duotone" />
          )}
        </View>
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={2} className="font-sans-semibold text-base leading-5 text-card-foreground">
            {title}
          </Text>
          <View className="flex-row items-center gap-1">
            <TypeIcon size={14} color={palette['muted-foreground']} />
            <Text numberOfLines={1} className="flex-shrink font-sans text-[13px] text-muted-foreground">
              {[t(`listingType.${item.type}`), item.municipalityName].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text className="font-sans-semibold text-sm text-card-foreground">{priceLabel(item.basePriceMinor, item.priceUnit)}</Text>
        </View>
        <CaretRight size={20} color={palette['muted-foreground']} />
      </PressableScale>

      <View className="gap-2 border-t border-border px-3 py-3">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <View className="flex-1 gap-1.5">
            <ListingStatusChip status={item.status} />
            {item.status === 'PUBLISHED' && item.visibility !== 'PUBLIC' ? <ListingVisibilityNote visibility={item.visibility} /> : null}
          </View>
          {action ? (
            <Button
              label={t(`listings.actions.${action}`)}
              variant="outline"
              onPress={run}
              loading={busy}
              accessibilityLabel={`${t(`listings.actions.${action}`)}: ${title}`}
            />
          ) : null}
        </View>
        <Text className="font-sans text-[13px] text-muted-foreground">
          {item.status === 'DRAFT' && !item.readyToPublish
            ? t('listings.incomplete')
            : item.blockedReason
              ? t(`listings.blockReasonShort.${item.blockedReason}`)
              : availability}
        </Text>
        {message ? (
          <Text
            accessibilityLiveRegion="polite"
            className={`font-sans-semibold text-sm ${message.error ? 'text-destructive' : 'text-success'}`}
          >
            {message.text}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
