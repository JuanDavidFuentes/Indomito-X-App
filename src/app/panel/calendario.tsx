import {
  addDays,
  isBlackedOut,
  isoWeekday,
  localDate,
  type BlackoutDto,
  type CalendarListing,
  type Locale,
  type SlotDto,
} from '@juandavidfuentes/indomitox-shared';
import type { ColorRole } from '@juandavidfuentes/indomitox-shared/tokens';
import { useLocalSearchParams } from 'expo-router';
import { ArrowSquareOut, Prohibit, Storefront } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlotRow } from '@/components/host/slot-row';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/fields';
import { useErrorText } from '@/lib/forms';
import { openOnWeb } from '@/lib/host';
import { formatInstant, MOBILE_CALENDAR_DAYS, noonOf, useHostCalendar, useListingTitle, usePullToRefresh } from '@/lib/listings';
import { usePalette } from '@/lib/theme';

/** Colores de las publicaciones (los mismos de la web, en el mismo orden). */
const LISTING_COLORS: ColorRole[] = ['tint-water', 'tint-land', 'tint-park', 'accent', 'difficulty-intermediate', 'success'];

function openingHoursOn(listing: CalendarListing, date: string) {
  const weekday = isoWeekday(date);
  return listing.openingHours.filter(
    (rule) => rule.weekdays.includes(weekday) && rule.validFrom <= date && (!rule.validUntil || date <= rule.validUntil),
  );
}

function blackoutsOn(blackouts: BlackoutDto[], date: string, listingId?: string) {
  return blackouts.filter(
    (blackout) => isBlackedOut(date, blackout) && (!listingId || blackout.listingIds === null || blackout.listingIds.includes(listingId)),
  );
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Calendario del Guía en el teléfono (AVAIL-04, MOB-01): cuatro semanas desde hoy, los horarios
 * del día con sus cupos y el botón para cerrarlos o abrirlos. Las salidas sueltas y los
 * bloqueos se crean en la web.
 */
export default function HostCalendarScreen() {
  const params = useLocalSearchParams<{ publicacion?: string }>();
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const errors = useErrorText();
  const listingTitle = useListingTitle();
  const locale = i18n.language as Locale;
  const [listingId, setListingId] = useState<string | undefined>(params.publicacion);
  const today = localDate(new Date());
  const [selected, setSelected] = useState(today);
  const calendar = useHostCalendar(listingId);
  // El filtro y los colores usan todas las publicaciones con calendario (como en la web), aunque la vista esté filtrada.
  const allListings = useHostCalendar(undefined, 1);
  const pull = usePullToRefresh(calendar.refetch);

  const services = useMemo(() => allListings.data?.listings ?? [], [allListings.data]);
  const colorOf = (id: string) => {
    const index = services.findIndex((item) => item.id === id);
    return palette[LISTING_COLORS[(index < 0 ? 0 : index) % LISTING_COLORS.length]!];
  };
  const titleOf = (id: string) => {
    const listing = calendar.data?.listings.find((item) => item.id === id) ?? services.find((item) => item.id === id);
    return listing ? listingTitle(listing.title) : '';
  };

  const days = useMemo(() => Array.from({ length: MOBILE_CALENDAR_DAYS }, (_, index) => addDays(today, index)), [today]);
  const calendarSlots = calendar.data?.slots;
  const slotsByDay = useMemo(() => {
    const map = new Map<string, SlotDto[]>();
    for (const slot of calendarSlots ?? []) {
      const day = localDate(slot.startsAt);
      map.set(day, [...(map.get(day) ?? []), slot]);
    }
    for (const list of map.values()) list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return map;
  }, [calendarSlots]);

  const blackouts = calendar.data?.blackouts ?? [];
  const daySlots = slotsByDay.get(selected) ?? [];
  const dayBlocked = blackoutsOn(blackouts, selected, listingId).length > 0;
  const openings = (calendar.data?.listings ?? [])
    .filter((listing) => !listingId || listing.id === listingId)
    .flatMap((listing) => openingHoursOn(listing, selected).map((rule) => ({ listing, rule })));
  const dayTitle = capitalize(formatInstant(noonOf(selected), locale, { weekday: 'long', day: 'numeric', month: 'long' }));

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      refreshControl={
        <RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} colors={[palette.primary]} tintColor={palette.primary} />
      }
    >
      <View className="gap-4 pt-2">
        <Text className="px-5 font-sans text-[15px] leading-[22px] text-muted-foreground">{t('hostApp.calendarHint')}</Text>

        {services.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-5"
            accessibilityRole="radiogroup"
            accessibilityLabel={t('calendar.filter')}
          >
            <Chip role="radio" label={t('calendar.allListings')} selected={!listingId} onPress={() => setListingId(undefined)} />
            {services.map((item) => (
              <Chip
                key={item.id}
                role="radio"
                label={listingTitle(item.title)}
                selected={listingId === item.id}
                onPress={() => setListingId(item.id)}
                leading={<View className="size-2.5 rounded-full" style={{ backgroundColor: colorOf(item.id) }} />}
              />
            ))}
          </ScrollView>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5"
          accessibilityLabel={t('hostApp.days')}
        >
          {days.map((day) => {
            const slots = slotsByDay.get(day) ?? [];
            const blocked = blackoutsOn(blackouts, day, listingId).length > 0;
            const isSelected = day === selected;
            const date = noonOf(day);
            const colors = [...new Set(slots.filter((slot) => slot.status === 'OPEN').map((slot) => slot.listingId))].slice(0, 3);
            return (
              <Pressable
                key={day}
                onPress={() => setSelected(day)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${t('hostApp.dayA11y', {
                  date: formatInstant(date, locale, { weekday: 'long', day: 'numeric', month: 'long' }),
                  count: slots.length,
                })}${blocked ? `, ${t('calendar.blocked')}` : ''}`}
                className={`h-[84px] w-16 items-center justify-center gap-0.5 rounded-xl border-2 active:opacity-80 ${
                  isSelected ? 'border-primary bg-primary' : day === today ? 'border-primary bg-card' : blocked ? 'border-warning/60 bg-warning/10' : 'border-border bg-card'
                }`}
              >
                <Text className={`font-display text-xs uppercase tracking-[1px] ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {formatInstant(date, locale, { weekday: 'short' }).replace('.', '')}
                </Text>
                <Text className={`font-display text-2xl ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>{Number(day.slice(8))}</Text>
                <View className="h-3 flex-row items-center gap-0.5">
                  {blocked ? (
                    <Prohibit size={12} color={isSelected ? palette['primary-foreground'] : palette.warning} weight="bold" />
                  ) : (
                    colors.map((id) => (
                      <View
                        key={id}
                        className="size-1.5 rounded-full"
                        style={{ backgroundColor: isSelected ? palette['primary-foreground'] : colorOf(id) }}
                      />
                    ))
                  )}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="gap-3 px-5">
          <View className="gap-0.5">
            <Text accessibilityRole="header" className="font-display-italic text-2xl uppercase text-foreground">
              {dayTitle}
            </Text>
            <Text className="font-sans text-sm text-muted-foreground">
              {selected === today ? `${t('calendar.today')} · ` : ''}
              {t('calendar.daySummary', { count: daySlots.length })}
            </Text>
          </View>

          {calendar.isPending ? (
            <ActivityIndicator color={palette.primary} accessibilityLabel={t('common.loading')} />
          ) : calendar.isError ? (
            <View className="gap-3">
              <Text className="font-sans text-base text-destructive">{errors.api(calendar.error)}</Text>
              <Button label={t('common.retry')} variant="outline" onPress={() => void calendar.refetch()} />
            </View>
          ) : (
            <View className="gap-3">
              {dayBlocked ? (
                <View className="flex-row items-center gap-2 rounded-lg border border-warning/50 bg-warning/10 px-4 py-3">
                  <Prohibit size={20} color={palette.warning} weight="bold" />
                  <Text className="flex-1 font-sans-semibold text-[15px] text-foreground">{t('hostApp.blockedDay')}</Text>
                </View>
              ) : null}
              {daySlots.length ? (
                <View className="rounded-xl border border-border bg-card px-4">
                  {daySlots.map((slot, index) => (
                    <View key={slot.id} className={index > 0 ? 'border-t border-border' : ''}>
                      <SlotRow slot={slot} title={titleOf(slot.listingId)} color={colorOf(slot.listingId)} />
                    </View>
                  ))}
                </View>
              ) : null}
              {openings.map(({ listing, rule }, index) => (
                <View key={`${listing.id}-${index}`} className="flex-row items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3">
                  <Storefront size={20} color={palette['muted-foreground']} />
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-[15px] text-foreground">{listingTitle(listing.title)}</Text>
                    <Text className="font-sans text-sm text-muted-foreground">{t('calendar.openFromTo', { from: rule.opensAt, to: rule.closesAt })}</Text>
                  </View>
                </View>
              ))}
              {!daySlots.length && !openings.length ? (
                <Text className="py-4 font-sans text-[15px] text-muted-foreground">{t('calendar.emptyDay')}</Text>
              ) : null}
            </View>
          )}

          <View className="pt-4">
            <Button label={t('hostApp.continueOnWeb')} variant="outline" icon={ArrowSquareOut} onPress={() => openOnWeb(locale, '/panel/calendario')} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
