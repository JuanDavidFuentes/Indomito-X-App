import { ActivityIndicator, ScrollView, View } from 'react-native';
import { ListingCard } from '@/components/listing-card';
import { useFeatured } from '@/lib/explore';
import { usePalette } from '@/lib/theme';

const CARD_WIDTH = 264;
const GAP = 16;

/** Aventuras destacadas: las recomendadas de la búsqueda (F4). Sin publicaciones no se muestra nada. */
export function FeaturedCarousel() {
  const palette = usePalette();
  const { data, isPending } = useFeatured();
  if (isPending) {
    return (
      <View className="h-72 items-center justify-center">
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + GAP}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 20, gap: GAP }}
    >
      {(data?.items ?? []).slice(0, 8).map((listing) => (
        <ListingCard key={listing.id} listing={listing} width={CARD_WIDTH} />
      ))}
    </ScrollView>
  );
}
