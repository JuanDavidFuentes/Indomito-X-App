import type { AuthUser } from '@juandavidfuentes/indomitox-shared';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Tape } from '@/components/brand';
import { TopoPattern } from '@/components/topo-pattern';
import { Button } from '@/components/ui/button';
import { openHostPanel } from '@/lib/host';
import { usePalette } from '@/lib/theme';
import { HostStatusChip } from './status-chip';

/**
 * Acceso al panel del Guía desde Perfil (AUTH-04: siempre se puede pasar a Guía). Con cuenta
 * de Guía muestra su estado; sin ella, la invitación a empezar el alta.
 */
export function HostCard({ user }: { user: AuthUser }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const host = user.host;

  return (
    <View className="overflow-hidden rounded-xl border border-transparent bg-night p-5 dark:border-border dark:bg-card">
      <TopoPattern color={palette.brand} opacity={0.2} variant="screen" />
      <View className="gap-3">
        <Tape label={t('host.panelTitle')} small />
        <Text accessibilityRole="header" className="font-display-italic text-2xl uppercase text-night-foreground">
          {host ? t('account.hostPanelTitle') : t('account.hostCtaTitle')}
        </Text>
        {host ? (
          <View className="gap-2">
            <Text className="font-sans-semibold text-base text-night-foreground">{host.name ?? t('admin.unnamed')}</Text>
            <HostStatusChip status={host.status} />
          </View>
        ) : (
          <Text className="font-sans text-[15px] leading-[21px] text-night-foreground/85">{t('account.hostCtaBody')}</Text>
        )}
        <Button
          label={host ? t('account.hostPanelButton') : t('account.hostCtaButton')}
          variant="onNight"
          onPress={openHostPanel}
        />
      </View>
    </View>
  );
}
