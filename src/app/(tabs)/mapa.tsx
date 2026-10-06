import { MapTrifold } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ComingSoon } from '@/components/coming-soon';

export default function MapScreen() {
  const { t } = useTranslation();
  return <ComingSoon icon={MapTrifold} title={t('nav.map')} />;
}
