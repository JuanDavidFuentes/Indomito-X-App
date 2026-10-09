import {
  addDays,
  canSortByDistance,
  DIFFICULTIES,
  DURATION_FILTERS,
  isoWeekday,
  LISTING_TYPES,
  SEARCH_LIMITS,
  SEARCH_SORTS,
  todayInPlatform,
  type SearchQuery,
} from '@juandavidfuentes/indomitox-shared';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Minus, Plus } from 'phosphor-react-native';
import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DifficultyShape } from '@/components/difficulty';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/fields';
import { usePalette } from '@/lib/theme';

export type FilterDraft = Pick<SearchQuery, 'type' | 'date' | 'guests' | 'minPrice' | 'maxPrice' | 'difficulty' | 'duration' | 'sort'>;

const pick = (query: SearchQuery): FilterDraft => ({
  type: query.type,
  date: query.date,
  guests: query.guests,
  minPrice: query.minPrice,
  maxPrice: query.maxPrice,
  difficulty: query.difficulty,
  duration: query.duration,
  sort: query.sort,
});

/** Próximo día de la semana ISO (6 = sábado) desde hoy, incluido. */
function nextWeekday(today: string, weekday: number): string {
  const diff = (weekday - isoWeekday(today) + 7) % 7;
  return addDays(today, diff);
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-display text-sm tracking-[1.6px] uppercase text-muted-foreground">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

/**
 * Filtros del mapa (SRCH-03) en una hoja: tipo, fecha (hoy, mañana, el fin de semana), personas,
 * precio, dificultad, duración y orden. Se aplican todos juntos con "Ver resultados".
 */
export function FiltersSheet({ ref, query, onApply }: { ref: Ref<BottomSheetModal>; query: SearchQuery; onApply: (draft: FilterDraft) => void }) {
  const { t } = useTranslation();
  const sheet = useRef<BottomSheetModal | null>(null);
  const [open, setOpen] = useState(false);
  // El botón "atrás" de Android cierra la hoja en vez de salir de la pantalla.
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      sheet.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [open]);
  const setRefs = (instance: BottomSheetModal | null) => {
    sheet.current = instance;
    if (typeof ref === 'function') ref(instance);
    else if (ref) (ref as { current: BottomSheetModal | null }).current = instance;
  };
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<FilterDraft>(() => pick(query));
  const set = <K extends keyof FilterDraft>(key: K, value: FilterDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const toggle = <T extends string>(list: T[] | undefined, value: T): T[] | undefined => {
    const next = list?.includes(value) ? list.filter((item) => item !== value) : [...(list ?? []), value];
    return next.length ? next : undefined;
  };
  const today = todayInPlatform();
  const dates = [
    { value: today, label: t('search.dates.today') },
    { value: addDays(today, 1), label: t('search.dates.tomorrow') },
    { value: nextWeekday(today, 6), label: t('search.dates.saturday') },
    { value: nextWeekday(today, 7), label: t('search.dates.sunday') },
  ].filter((option, index, all) => all.findIndex((other) => other.value === option.value) === index);
  const pesos = (text: string) => {
    const digits = text.replace(/\D/g, '');
    return digits ? Math.min(Number(digits), SEARCH_LIMITS.priceMax) : undefined;
  };
  // Uniwind solo garantiza `className` en los componentes de React Native: aquí, `style`.
  const inputStyle = {
    height: 48,
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.input,
    backgroundColor: palette.background,
    paddingHorizontal: 12,
    fontFamily: 'Barlow_400Regular',
    fontSize: 16,
    color: palette.foreground,
  } as const;

  return (
    <BottomSheetModal
      ref={setRefs}
      snapPoints={['88%']}
      enableDynamicSizing={false}
      onChange={(index) => {
        if (index === 0) setDraft(pick(query));
        setOpen(index >= 0);
      }}
      onDismiss={() => setOpen(false)}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />}
      backgroundStyle={{ backgroundColor: palette.card }}
      handleIndicatorStyle={{ backgroundColor: palette['muted-foreground'] }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 24 }}>
        <Text accessibilityRole="header" className="font-display-italic text-3xl uppercase text-foreground">
          {t('search.filters')}
        </Text>

        <Group title={t('search.type')}>
          <Chip role="radio" label={t('search.anyType')} selected={!draft.type} onPress={() => set('type', undefined)} />
          {LISTING_TYPES.map((type) => (
            <Chip key={type} role="radio" label={t(`listingType.${type}`)} selected={draft.type === type} onPress={() => set('type', type)} />
          ))}
        </Group>

        <Group title={t('search.date')}>
          <Chip role="radio" label={t('search.anyDate')} selected={!draft.date} onPress={() => set('date', undefined)} />
          {dates.map((option) => (
            <Chip key={option.value} role="radio" label={option.label} selected={draft.date === option.value} onPress={() => set('date', option.value)} />
          ))}
        </Group>

        <View className="gap-3">
          <Text accessibilityRole="header" className="font-display text-sm tracking-[1.6px] uppercase text-muted-foreground">
            {t('search.guests')}
          </Text>
          <View className="flex-row items-center gap-4">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('common.remove')} (${t('search.guests')})`}
              disabled={!draft.guests}
              onPress={() => set('guests', draft.guests && draft.guests > 1 ? draft.guests - 1 : undefined)}
              className="size-12 items-center justify-center rounded-full border-2 border-border disabled:opacity-40"
            >
              <Minus size={20} color={palette.foreground} weight="bold" />
            </Pressable>
            <Text accessibilityLiveRegion="polite" className="min-w-28 text-center font-sans-semibold text-base text-foreground">
              {draft.guests ? t('search.guestsValue', { count: draft.guests }) : t('search.any')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('common.add')} (${t('search.guests')})`}
              disabled={(draft.guests ?? 0) >= SEARCH_LIMITS.guestsMax}
              onPress={() => set('guests', (draft.guests ?? 0) + 1)}
              className="size-12 items-center justify-center rounded-full border-2 border-border disabled:opacity-40"
            >
              <Plus size={20} color={palette.foreground} weight="bold" />
            </Pressable>
          </View>
        </View>

        <View className="gap-3">
          <Text accessibilityRole="header" className="font-display text-sm tracking-[1.6px] uppercase text-muted-foreground">
            {t('search.price')}
          </Text>
          <View className="flex-row gap-3">
            <BottomSheetTextInput
              accessibilityLabel={t('search.minPrice')}
              placeholder={t('search.minPrice')}
              placeholderTextColor={palette['muted-foreground']}
              keyboardType="number-pad"
              value={draft.minPrice === undefined ? '' : String(draft.minPrice)}
              onChangeText={(text) => set('minPrice', pesos(text))}
              style={inputStyle}
            />
            <BottomSheetTextInput
              accessibilityLabel={t('search.maxPrice')}
              placeholder={t('search.maxPrice')}
              placeholderTextColor={palette['muted-foreground']}
              keyboardType="number-pad"
              value={draft.maxPrice === undefined ? '' : String(draft.maxPrice)}
              onChangeText={(text) => set('maxPrice', pesos(text))}
              style={inputStyle}
            />
          </View>
        </View>

        <Group title={t('search.difficulty')}>
          {DIFFICULTIES.map((level) => (
            <Chip
              key={level}
              label={t(`difficulty.${level}`)}
              selected={Boolean(draft.difficulty?.includes(level))}
              leading={<DifficultyShape level={level} size={11} />}
              onPress={() => set('difficulty', toggle(draft.difficulty, level))}
            />
          ))}
        </Group>

        <Group title={t('search.duration')}>
          {DURATION_FILTERS.map((duration) => (
            <Chip
              key={duration}
              label={t(`search.durations.${duration}`)}
              selected={Boolean(draft.duration?.includes(duration))}
              onPress={() => set('duration', toggle(draft.duration, duration))}
            />
          ))}
        </Group>

        <Group title={t('search.sort')}>
          {SEARCH_SORTS.filter((sort) => sort !== 'DISTANCE' || canSortByDistance(query)).map((sort) => (
            <Chip key={sort} role="radio" label={t(`search.sorts.${sort}`)} selected={draft.sort === sort} onPress={() => set('sort', sort)} />
          ))}
        </Group>
      </BottomSheetScrollView>
      <View className="flex-row gap-3 border-t border-border bg-card px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        {/* Uniwind no garantiza `className` en componentes animados: el ancho lo da un View. */}
        <View className="flex-1">
          <Button
            label={t('search.clearFilters')}
            variant="outline"
            onPress={() => setDraft({ type: undefined, date: undefined, guests: undefined, minPrice: undefined, maxPrice: undefined, difficulty: undefined, duration: undefined, sort: 'RELEVANCE' })}
          />
        </View>
        <View className="flex-1">
          <Button label={t('search.showResults')} onPress={() => onApply(draft)} />
        </View>
      </View>
    </BottomSheetModal>
  );
}
