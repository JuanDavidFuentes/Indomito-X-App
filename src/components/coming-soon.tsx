import type { IconProps } from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tape } from '@/components/brand';
import { TopoPattern } from '@/components/topo-pattern';
import { usePalette } from '@/lib/theme';

/** Pantalla provisional de las pestañas que se construyen en fases posteriores. */
export function ComingSoon({
  icon: Icon,
  title,
  body,
}: {
  icon: ComponentType<IconProps>;
  title: string;
  body: string;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <TopoPattern color={palette.primary} opacity={0.18} variant="screen" />
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Animated.View entering={ZoomIn.springify().damping(14)}>
          <View
            className="size-24 items-center justify-center rounded-3xl border border-transparent bg-night dark:border-border dark:bg-card"
            style={{ transform: [{ rotate: '-4deg' }] }}
          >
            <Icon size={46} color={palette.accent} weight="duotone" />
          </View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(120)}>
          <View className="items-center gap-3">
            <Text accessibilityRole="header" className="text-center font-display-italic text-5xl uppercase text-foreground">
              {title}
            </Text>
            <Text className="text-center font-sans text-base leading-6 text-muted-foreground">{body}</Text>
            <Tape label={t('common.comingSoon')} align="center" />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}
