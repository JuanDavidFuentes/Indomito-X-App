import { router, type Href } from 'expo-router';
import { Desktop } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tape } from '@/components/brand';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { TopoPattern } from '@/components/topo-pattern';
import { Button } from '@/components/ui/button';
import { dismissHostPanelNotice } from '@/lib/preferences';
import { usePalette } from '@/lib/theme';

/**
 * MOB-02: al entrar a la administración aparece "Para una mejor experiencia administra desde la
 * web", con Continuar y No volver a mostrar (se recuerda en el teléfono).
 */
export default function HostPanelNotice() {
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  const goToPanel = (dontShowAgain: boolean) => {
    if (dontShowAgain) dismissHostPanelNotice();
    // Ruta índice de la carpeta panel/.
    router.replace('/panel' as Href);
  };

  return (
    <View className="flex-1 bg-night" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <FocusAwareStatusBar style="light" />
      <TopoPattern color={palette.brand} opacity={0.22} variant="screen" />
      <View className="flex-1 justify-center gap-6 px-6">
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <View
            className="size-24 items-center justify-center rounded-3xl border border-night-foreground/20 bg-night"
            style={{ transform: [{ rotate: '-4deg' }] }}
          >
            <Desktop size={48} color={palette.accent} weight="duotone" />
          </View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120)}>
          <View className="gap-4">
            <Tape label={t('hostApp.noticeEyebrow')} />
            <Text accessibilityRole="header" className="font-display-italic text-5xl leading-[48px] uppercase text-night-foreground">
              {t('hostApp.noticeTitle')}
            </Text>
            <Text className="font-sans text-lg leading-7 text-night-foreground/85">{t('hostApp.noticeBody')}</Text>
          </View>
        </Animated.View>
      </View>
      <View className="gap-3 px-6">
        <Button label={t('hostApp.noticeContinue')} onPress={() => goToPanel(false)} />
        <Button label={t('hostApp.noticeDontShow')} variant="onNight" onPress={() => goToPanel(true)} />
      </View>
    </View>
  );
}
