import {
  formatMoney,
  LISTING_LIMITS,
  usesSlots,
  type HostListingResponse,
  type ListingHostAction,
  type Locale,
  type ProductVariantDto,
} from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { ArrowSquareOut, CalendarBlank, MapPin, Minus, Plus, Storefront } from 'phosphor-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SavedNote } from '@/components/account/form-screen';
import { actionDoneKey, LISTING_TYPE_ICONS } from '@/components/host/listing-row';
import { SlotRow } from '@/components/host/slot-row';
import { ListingStatusChip, ListingVisibilityNote } from '@/components/host/status-chip';
import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/fields';
import { api } from '@/lib/api';
import { useErrorText } from '@/lib/forms';
import { openOnWeb } from '@/lib/host';
import {
  MOBILE_LISTING_ACTIONS,
  minorToPesos,
  pesosToMinor,
  photoUrl,
  transitionListing,
  useHostCalendar,
  useHostListing,
  useListingTitle,
  usePriceLabel,
  useStoreListing,
} from '@/lib/listings';
import { usePalette } from '@/lib/theme';

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="font-display-italic text-xl uppercase text-card-foreground">
          {title}
        </Text>
        {hint ? <Text className="font-sans text-sm leading-5 text-muted-foreground">{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** Pausar, reanudar, publicar o retirar de la revisión (lo que el estado permita). */
function StatusActions({ data }: { data: HostListingResponse }) {
  const { t } = useTranslation();
  const errors = useErrorText();
  const storeListing = useStoreListing();
  const [busy, setBusy] = useState<ListingHostAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actions = data.actions.filter(
    (action) => (MOBILE_LISTING_ACTIONS as readonly ListingHostAction[]).includes(action) && (action !== 'PUBLISH' || data.blockers.length === 0),
  );
  const incomplete = data.listing.status === 'DRAFT' && data.blockers.length > 0;

  const run = async (action: ListingHostAction) => {
    setBusy(action);
    setMessage(null);
    setError(null);
    try {
      const result = await transitionListing(data.listing.id, action);
      storeListing(result);
      setMessage(t(actionDoneKey(action, result.listing.status)));
    } catch (caught) {
      setError(errors.api(caught));
    } finally {
      setBusy(null);
    }
  };

  if (!actions.length && !incomplete) return null;
  return (
    <View className="gap-3">
      {incomplete ? <Text className="font-sans-semibold text-[15px] text-warning">{t('listings.incomplete')}</Text> : null}
      {actions.map((action) => (
        <Button
          key={action}
          label={action === 'PUBLISH' && data.preModeration ? t('listings.actions.SUBMIT') : t(`listings.actions.${action}`)}
          variant={action === 'PAUSE' || action === 'WITHDRAW' ? 'outline' : 'primary'}
          loading={busy === action}
          disabled={busy !== null}
          onPress={() => void run(action)}
        />
      ))}
      {error ? <FormAlert message={error} /> : null}
      <SavedNote message={message} />
    </View>
  );
}

/** Cambio rápido del precio base (MOB-03): un campo y un botón. */
function PriceEditor({ data }: { data: HostListingResponse }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const storeListing = useStoreListing();
  const { listing } = data;
  const initial = minorToPesos(listing.basePriceMinor);
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const minor = pesosToMinor(value);
  const label = t('hostApp.priceLabel', { unit: t(`priceUnit.${listing.priceUnit}`) });

  const save = async () => {
    setSaved(null);
    if (minor === null || minor < LISTING_LIMITS.priceMinMinor || minor > LISTING_LIMITS.priceMaxMinor) {
      setFieldError(errors.field('validation.priceInvalid') ?? null);
      return;
    }
    setFieldError(null);
    setSaving(true);
    try {
      const result = await api<HostListingResponse>(`/v1/host/listings/${listing.id}`, { method: 'PATCH', body: { basePriceMinor: minor } });
      storeListing(result);
      setValue(minorToPesos(result.listing.basePriceMinor));
      setSaved(t('hostApp.priceSaved'));
    } catch (caught) {
      setFieldError(errors.api(caught));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="gap-3">
      <View className="gap-1.5">
        <Text className="font-sans-semibold text-sm text-foreground">{label}</Text>
        <View className={`h-12 flex-row items-center rounded-md border bg-card px-4 ${fieldError ? 'border-destructive' : 'border-input'}`}>
          <Text className="pr-1 font-sans-semibold text-base text-muted-foreground">$</Text>
          <TextInput
            value={value}
            onChangeText={(text) => {
              setValue(text.replace(/[^\d]/g, ''));
              setSaved(null);
            }}
            keyboardType="number-pad"
            inputMode="numeric"
            returnKeyType="done"
            onSubmitEditing={() => void save()}
            accessibilityLabel={label}
            placeholderTextColor={palette['muted-foreground']}
            className="flex-1 font-sans text-base text-foreground"
          />
        </View>
        {minor !== null ? (
          <Text className="font-sans text-sm text-muted-foreground">{formatMoney(minor, 'COP', i18n.language as Locale)}</Text>
        ) : null}
        {fieldError ? (
          <Text accessibilityLiveRegion="polite" role="alert" className="font-sans-medium text-sm text-destructive">
            {fieldError}
          </Text>
        ) : null}
      </View>
      <Button label={t('hostApp.savePrice')} variant="outline" onPress={save} loading={saving} disabled={value === initial} />
      <SavedNote message={saved} />
    </View>
  );
}

/** Existencias de cada variante con − y + (se guardan al instante). */
function StockEditor({ data }: { data: HostListingResponse }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const storeListing = useStoreListing();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const variants = data.listing.variants;

  const setStock = async (variant: ProductVariantDto, stock: number) => {
    setBusy(variant.id);
    setError(null);
    try {
      storeListing(
        await api<HostListingResponse>(`/v1/host/listings/${data.listing.id}/variants/${variant.id}`, { method: 'PATCH', body: { stock } }),
      );
    } catch (caught) {
      setError(errors.api(caught));
    } finally {
      setBusy(null);
    }
  };

  const name = (variant: ProductVariantDto) => [variant.size, variant.color].filter(Boolean).join(' · ') || t('listings.variants.single');

  return (
    <View>
      {variants.map((variant, index) => {
        const disabled = busy !== null;
        return (
          <View key={variant.id} className={`min-h-14 flex-row items-center gap-3 py-2 ${index > 0 ? 'border-t border-border' : ''}`}>
            <View className="flex-1">
              <Text className={`font-sans-semibold text-base ${variant.active ? 'text-card-foreground' : 'text-muted-foreground line-through'}`}>
                {name(variant)}
              </Text>
              {variant.sku ? <Text className="font-sans text-xs text-muted-foreground">{variant.sku}</Text> : null}
            </View>
            <Pressable
              onPress={() => void setStock(variant, variant.stock - 1)}
              disabled={disabled || variant.stock <= 0}
              accessibilityRole="button"
              accessibilityLabel={t('hostApp.decreaseStock', { variant: name(variant) })}
              className={`size-12 items-center justify-center rounded-xl border-2 border-border bg-card active:opacity-80 ${
                disabled || variant.stock <= 0 ? 'opacity-40' : ''
              }`}
            >
              <Minus size={20} color={palette.foreground} weight="bold" />
            </Pressable>
            <View className="w-14 items-center" accessible accessibilityLiveRegion="polite" accessibilityLabel={`${name(variant)}: ${variant.stock}`}>
              {busy === variant.id ? (
                <ActivityIndicator color={palette.primary} />
              ) : (
                <Text className="font-display text-2xl text-card-foreground">{variant.stock}</Text>
              )}
            </View>
            <Pressable
              onPress={() => void setStock(variant, variant.stock + 1)}
              disabled={disabled || variant.stock >= LISTING_LIMITS.stockMax}
              accessibilityRole="button"
              accessibilityLabel={t('hostApp.increaseStock', { variant: name(variant) })}
              className={`size-12 items-center justify-center rounded-xl border-2 border-border bg-card active:opacity-80 ${disabled ? 'opacity-40' : ''}`}
            >
              <Plus size={20} color={palette.foreground} weight="bold" />
            </Pressable>
          </View>
        );
      })}
      {error ? <FormAlert message={error} /> : null}
    </View>
  );
}

/** Próximos horarios (servicios) u horario de atención (alquileres), de las próximas dos semanas. */
function Upcoming({ data }: { data: HostListingResponse }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { listing } = data;
  const calendar = useHostCalendar(listing.id, 14);
  // Los que ya terminaron (de hoy) no se muestran; la referencia es el momento de la consulta.
  const fetchedAt = new Date(calendar.dataUpdatedAt).toISOString();
  const slots = (calendar.data?.slots ?? []).filter((slot) => slot.endsAt > fetchedAt).slice(0, 6);
  const openingHours = calendar.data?.listings.find((item) => item.id === listing.id)?.openingHours ?? [];

  if (calendar.isPending) return <ActivityIndicator color={palette.primary} accessibilityLabel={t('common.loading')} />;
  return (
    <View className="gap-2">
      {usesSlots(listing.type) ? (
        slots.length ? (
          <View>
            {slots.map((slot, index) => (
              <View key={slot.id} className={index > 0 ? 'border-t border-border' : ''}>
                <SlotRow slot={slot} showDate />
              </View>
            ))}
          </View>
        ) : (
          <Text className="font-sans text-[15px] text-muted-foreground">{t('hostApp.noUpcoming')}</Text>
        )
      ) : openingHours.length ? (
        openingHours.map((rule, index) => (
          <View key={index} className="flex-row items-center gap-2">
            <Storefront size={18} color={palette['muted-foreground']} />
            <Text className="flex-1 font-sans text-[15px] text-card-foreground">
              {rule.weekdays.map((day) => t(`weekdaysShort.${day}`)).join(', ')} · {t('calendar.openFromTo', { from: rule.opensAt, to: rule.closesAt })}
            </Text>
          </View>
        ))
      ) : (
        <Text className="font-sans text-[15px] text-muted-foreground">{t('listings.noSlots')}</Text>
      )}
      <Button
        label={t('hostApp.openCalendar')}
        variant="ghost"
        icon={CalendarBlank}
        onPress={() => router.push({ pathname: '/panel/calendario', params: { publicacion: listing.id } } as Href)}
      />
    </View>
  );
}

/** Detalle de una publicación en el teléfono con sus acciones rápidas (MOB-01/03). */
export default function HostListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const errors = useErrorText();
  const locale = i18n.language as Locale;
  const { data, isPending, isError, error, refetch } = useHostListing(id);
  const listingTitle = useListingTitle();
  const priceLabel = usePriceLabel();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={palette.primary} accessibilityLabel={t('common.loading')} />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View className="flex-1 gap-3 bg-background px-5 pt-6">
        <Text className="font-sans text-base text-destructive">{errors.api(error)}</Text>
        <Button label={t('common.retry')} variant="outline" onPress={() => void refetch()} />
      </View>
    );
  }

  const { listing } = data;
  const title = listingTitle(listing.title);
  const cover = photoUrl(listing.photos[0], 960);
  const TypeIcon = LISTING_TYPE_ICONS[listing.type];

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Stack.Screen options={{ title: t(`listingType.${listing.type}`) }} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View className="gap-5 px-5 pt-2">
          <View className="aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-muted">
            {cover ? (
              <Image
                source={{ uri: cover }}
                placeholder={listing.photos[0]?.placeholder ? { uri: listing.photos[0].placeholder } : undefined}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                accessible={false}
              />
            ) : (
              <TypeIcon size={48} color={palette['muted-foreground']} weight="duotone" />
            )}
          </View>

          <View className="gap-2">
            <Text className="font-display text-sm uppercase tracking-[2px] text-secondary">
              {[t(`listingType.${listing.type}`), ...listing.sportKeys.map((key) => t(`sports.${key}`, { defaultValue: key }))].join(' · ')}
            </Text>
            <Text accessibilityRole="header" className="font-display-italic text-[30px] leading-[32px] uppercase text-foreground">
              {title}
            </Text>
            <Text className="font-sans-semibold text-base text-foreground">{priceLabel(listing.basePriceMinor, listing.priceUnit)}</Text>
            {listing.municipality ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={16} color={palette['muted-foreground']} />
                <Text className="font-sans text-sm text-muted-foreground">
                  {listing.municipality.name}, {listing.municipality.departmentName}
                </Text>
              </View>
            ) : null}
            <View className="flex-row flex-wrap items-center gap-3 pt-1">
              <ListingStatusChip status={listing.status} />
              <ListingVisibilityNote visibility={listing.visibility} />
            </View>
            {listing.blocked ? (
              <Text className="font-sans text-sm text-warning">{t(`listings.blockReasonShort.${listing.blocked.reason}`)}</Text>
            ) : null}
            {listing.moderationNote && listing.status === 'DRAFT' ? (
              <View className="gap-1 rounded-lg border-l-4 border-brand bg-muted px-4 py-3">
                <Text className="font-display text-xs uppercase tracking-[2px] text-muted-foreground">{t('host.reasonLabel')}</Text>
                <Text className="font-sans text-[15px] leading-[21px] text-foreground">{listing.moderationNote}</Text>
              </View>
            ) : null}
          </View>

          <Section title={t('hostApp.quickActions')}>
            <StatusActions data={data} />
            <PriceEditor data={data} />
          </Section>

          {listing.type === 'PRODUCT' && listing.variants.length ? (
            <Section title={t('hostApp.stockTitle')} hint={t('hostApp.stockHint')}>
              <StockEditor data={data} />
            </Section>
          ) : null}

          {listing.type !== 'PRODUCT' ? (
            <Section title={t('hostApp.nextSlots')}>
              <Upcoming data={data} />
            </Section>
          ) : null}

          <View className="gap-2">
            <Button
              label={t('hostApp.editOnWeb')}
              variant="outline"
              icon={ArrowSquareOut}
              onPress={() => openOnWeb(locale, '/panel/publicaciones/[id]', { id: listing.id })}
            />
            <Text className="text-center font-sans text-sm text-muted-foreground">{t('hostApp.editOnWebHint')}</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
