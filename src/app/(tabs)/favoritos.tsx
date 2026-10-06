import { Heart } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ComingSoon } from '@/components/coming-soon';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  return <ComingSoon icon={Heart} title={t('nav.favorites')} />;
}
