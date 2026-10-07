import {
  convertMinor,
  DEMO_FEATURED,
  DEMO_FX_RATES,
  formatMoney,
  type Locale,
} from '@juandavidfuentes/indomitox-shared';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { ListingCard } from '@/components/listing-card';
import { PHOTOS } from '@/lib/photos';

const CARD_WIDTH = 264;
const GAP = 16;

/**
 * Aventuras destacadas. EJEMPLO hasta F4: datos de shared (DEMO_FEATURED), siempre con la cinta
 * "Ejemplo" y sin calificaciones inventadas.
 */
export function FeaturedCarousel() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language as Locale;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + GAP}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 20, gap: GAP }}
    >
      {DEMO_FEATURED.map((listing) => {
        const duration =
          listing.durationMinutes >= 60
            ? t('listing.durationHours', { hours: listing.durationMinutes / 60 })
            : t('listing.durationMinutes', { minutes: listing.durationMinutes });
        const usd = convertMinor(listing.priceFromMinor, 'COP', 'USD', DEMO_FX_RATES);
        return (
          <ListingCard
            key={listing.id}
            width={CARD_WIDTH}
            photo={PHOTOS[listing.photo]}
            sport={t(`sports.${listing.sport}`)}
            title={t(`demo.featured.${listing.id}`)}
            meta={`${listing.zone} · ${duration}`}
            difficulty={listing.difficulty}
            priceFrom={formatMoney(listing.priceFromMinor, 'COP', locale)}
            priceApprox={formatMoney(usd, 'USD', locale, { round: true })}
            exampleLabel={t('common.example')}
          />
        );
      })}
    </ScrollView>
  );
}
