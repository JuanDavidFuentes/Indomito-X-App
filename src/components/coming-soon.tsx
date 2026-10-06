import type { IconProps } from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePalette } from '@/lib/theme';

/** Pantalla provisional de las pestañas que se construyen en fases posteriores. */
export function ComingSoon({ icon: Icon, title }: { icon: ComponentType<IconProps>; title: string }) {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="size-20 items-center justify-center rounded-2xl bg-muted">
          <Icon size={40} color={palette.primary} weight="duotone" />
        </View>
        <Text className="text-center font-display text-4xl uppercase text-foreground">{title}</Text>
        <Text className="rounded-full bg-muted px-4 py-1.5 font-sans-semibold text-sm text-muted-foreground">
          {t('common.comingSoon')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
