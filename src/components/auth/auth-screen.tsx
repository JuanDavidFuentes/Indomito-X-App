import type { PhotoId } from '@juandavidfuentes/indomitox-shared';
import { motion } from '@juandavidfuentes/indomitox-shared/tokens';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { X } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { Tape } from '@/components/brand';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { PhotoShade } from '@/components/photo-shade';
import { TopoPattern } from '@/components/topo-pattern';
import { PHOTOS } from '@/lib/photos';
import { usePalette } from '@/lib/theme';

const CUT = 22;

/**
 * Marco de ingreso, registro y recuperación ("Expedición Santander"): franja de foto con velo
 * Noche, curvas de nivel, cinta y titular itálico; el formulario debajo, con el teclado bajo
 * control. Se abre como modal: la X vuelve a donde estaba el usuario (AUTH-07).
 */
export function AuthScreen({
  photo,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  photo: PhotoId;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <FocusAwareStatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="overflow-hidden bg-night" style={{ paddingTop: insets.top + 8 }}>
          <Image source={PHOTOS[photo]} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
          <PhotoShade
            stops={[
              { at: 0, color: palette.night, opacity: 0.75 },
              { at: 0.35, color: palette.night, opacity: 0.25 },
              { at: 1, color: palette.night, opacity: 0.95 },
            ]}
          />
          <TopoPattern color={palette.brand} opacity={0.22} />
          <View className="flex-row px-3">
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              className="size-12 items-center justify-center rounded-full bg-night/50 active:opacity-80"
            >
              <X size={24} color={palette['night-foreground']} weight="bold" />
            </Pressable>
          </View>
          <View className="gap-3 px-5 pt-20" style={{ paddingBottom: CUT + 22 }}>
            <Animated.View entering={FadeInDown.duration(motion.slow)}>
              <Tape label={eyebrow} />
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(motion.slow).delay(motion.stagger * 2)}>
              <Text
                accessibilityRole="header"
                className="font-display-italic text-[40px] leading-[40px] uppercase text-night-foreground"
              >
                {title}
              </Text>
            </Animated.View>
          </View>
          <Svg
            width="100%"
            height={CUT}
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}
            pointerEvents="none"
          >
            <Polygon points="0,10.5 100,0 100,10.5" fill={palette.background} />
          </Svg>
        </View>

        <View className="gap-6 px-5 pt-4">
          {subtitle ? <Text className="font-sans text-base leading-6 text-muted-foreground">{subtitle}</Text> : null}
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
