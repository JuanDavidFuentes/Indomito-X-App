import { HOST_LISTING_FILTERS, type HostListingFilter, type ListingStatus, type Locale } from '@juandavidfuentes/indomitox-shared';
import { ArrowSquareOut, Compass } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListingRow } from '@/components/host/listing-row';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/fields';
import { useErrorText } from '@/lib/forms';
import { openOnWeb } from '@/lib/host';
import { useHostListings, usePullToRefresh } from '@/lib/listings';
import { usePalette } from '@/lib/theme';

/** Publicaciones del Guía en el teléfono: estado, próxima salida o stock y la acción rápida (MOB-01/03). */
export default function HostListingsScreen() {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const errors = useErrorText();
  const locale = i18n.language as Locale;
  const [filter, setFilter] = useState<HostListingFilter>('ALL');
  const { data, isPending, isError, error, refetch } = useHostListings(filter);
  const pull = usePullToRefresh(refetch);
  // Los conteos salen de cualquier respuesta (no dependen del filtro).
  const counts = data?.counts;
  const total = counts ? Object.entries(counts).reduce((sum, [status, count]) => (status === 'ARCHIVED' ? sum : sum + count), 0) : 0;

  const header = (
    <View className="gap-4 pb-4">
      <Text className="font-sans text-[15px] leading-[22px] text-muted-foreground">{t('hostApp.listingsHint')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
        accessibilityRole="radiogroup"
        accessibilityLabel={t('common.status')}
      >
        {HOST_LISTING_FILTERS.map((option) => {
          const count = option === 'ALL' ? total : (counts?.[option as ListingStatus] ?? 0);
          const label = option === 'ALL' ? t('listings.filterAll') : t(`listingStatus.${option}`);
          return (
            <Chip
              key={option}
              role="radio"
              label={counts ? `${label} ${count}` : label}
              selected={filter === option}
              onPress={() => setFilter(option)}
            />
          );
        })}
      </ScrollView>
    </View>
  );

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={palette.primary} accessibilityLabel={t('common.loading')} />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32, gap: 12 }}
      data={data?.items ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ListingRow item={item} />}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} colors={[palette.primary]} tintColor={palette.primary} />}
      ListEmptyComponent={
        isError ? (
          <View className="gap-3">
            <Text className="font-sans text-base text-destructive">{errors.api(error)}</Text>
            <Button label={t('common.retry')} variant="outline" onPress={() => void refetch()} />
          </View>
        ) : filter !== 'ALL' ? (
          <Text className="py-8 text-center font-sans text-base text-muted-foreground">{t('listings.emptyFilter')}</Text>
        ) : (
          <View className="items-center gap-3 rounded-xl border-2 border-dashed border-border px-5 py-8">
            <Compass size={40} color={palette['muted-foreground']} weight="duotone" />
            <Text accessibilityRole="header" className="text-center font-display-italic text-2xl uppercase text-foreground">
              {t('listings.emptyTitle')}
            </Text>
            <Text className="text-center font-sans text-[15px] leading-[22px] text-muted-foreground">{t('hostApp.listingsEmptyBody')}</Text>
            <Button label={t('hostApp.createOnWeb')} icon={ArrowSquareOut} onPress={() => openOnWeb(locale, '/panel/publicaciones')} />
          </View>
        )
      }
      ListFooterComponent={
        data?.items.length ? (
          <View className="pt-4">
            <Button label={t('hostApp.continueOnWeb')} variant="outline" icon={ArrowSquareOut} onPress={() => openOnWeb(locale, '/panel/publicaciones')} />
          </View>
        ) : null
      }
    />
  );
}
