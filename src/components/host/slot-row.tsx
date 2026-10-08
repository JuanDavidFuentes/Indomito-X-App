import { localTime, slotRemaining, type Locale, type SlotDto } from '@juandavidfuentes/indomitox-shared';
import { useQueryClient } from '@tanstack/react-query';
import { Lock, LockOpen, UsersThree } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { api } from '@/lib/api';
import { useErrorText } from '@/lib/forms';
import { CALENDAR_KEY, formatInstant, LISTINGS_KEY } from '@/lib/listings';
import { usePalette } from '@/lib/theme';

/**
 * Un horario con sus cupos y el botón para cerrarlo o abrirlo (AVAIL-03). Con `showDate`, lleva
 * la fecha (en el detalle de una publicación); en el calendario, el título de la publicación.
 */
export function SlotRow({ slot, title, showDate = false, color }: { slot: SlotDto; title?: string; showDate?: boolean; color?: string }) {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const locale = i18n.language as Locale;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closed = slot.status === 'CLOSED';
  const unavailable = closed || slot.blackedOut;
  const time = localTime(slot.startsAt);
  const when = showDate ? formatInstant(slot.startsAt, locale, { weekday: 'short', day: 'numeric', month: 'short' }) : null;
  const remaining = slotRemaining(slot);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      await api<SlotDto>(`/v1/host/slots/${slot.id}`, { method: 'PATCH', body: { status: closed ? 'OPEN' : 'CLOSED' } });
      await queryClient.invalidateQueries({ queryKey: CALENDAR_KEY });
      void queryClient.invalidateQueries({ queryKey: LISTINGS_KEY });
    } catch (caught) {
      setError(errors.api(caught));
    } finally {
      setBusy(false);
    }
  };

  const label = closed
    ? t('hostApp.closedA11y', { time: when ? `${when}, ${time}` : time, title: title ?? '' })
    : t('hostApp.slotA11y', { time: when ? `${when}, ${time}` : time, title: title ?? '', remaining, capacity: slot.capacity });

  return (
    <View className="gap-1 py-3">
      <View className="min-h-12 flex-row items-center gap-3">
        <View accessible accessibilityLabel={label} className="flex-1 flex-row items-center gap-3">
          {color ? <View className="h-10 w-1.5 rounded-full" style={{ backgroundColor: color }} /> : null}
          <View className="flex-1 gap-0.5">
            <Text className={`font-display text-xl text-foreground ${unavailable ? 'text-muted-foreground line-through' : ''}`}>
              {when ? `${when} · ${time}` : time}
            </Text>
            {title ? (
              <Text numberOfLines={1} className="font-sans text-sm text-foreground">
                {title}
              </Text>
            ) : null}
            <View className="flex-row items-center gap-1">
              <UsersThree size={14} color={palette['muted-foreground']} />
              <Text className="font-sans text-[13px] text-muted-foreground">
                {closed ? t('calendar.closed') : slot.blackedOut ? t('calendar.blocked') : t('calendar.remaining', { remaining, capacity: slot.capacity })}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={toggle}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`${closed ? t('calendar.reopen') : t('calendar.close')}: ${time}`}
          accessibilityState={{ busy, disabled: busy }}
          className={`min-h-12 min-w-24 flex-row items-center justify-center gap-1.5 rounded-xl border-2 px-3 active:opacity-80 ${
            closed ? 'border-primary bg-primary/10' : 'border-border bg-card'
          } ${busy ? 'opacity-50' : ''}`}
        >
          {closed ? <LockOpen size={18} color={palette.primary} weight="bold" /> : <Lock size={18} color={palette.foreground} weight="bold" />}
          <Text className={`font-sans-semibold text-[15px] ${closed ? 'text-primary' : 'text-foreground'}`}>
            {closed ? t('calendar.reopen') : t('calendar.close')}
          </Text>
        </Pressable>
      </View>
      {error ? (
        <Text accessibilityLiveRegion="polite" className="font-sans-medium text-sm text-destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
