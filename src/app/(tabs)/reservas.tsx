import { CalendarCheck } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ComingSoon } from '@/components/coming-soon';

export default function ReservationsScreen() {
  const { t } = useTranslation();
  return <ComingSoon icon={CalendarCheck} title={t('nav.reservations')} body={t('soon.reservations')} />;
}
