import type { AuthUser } from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CheckCircle, Warning } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { Tape } from '@/components/brand';
import { TopoPattern } from '@/components/topo-pattern';
import { Button } from '@/components/ui/button';
import { mediaUrl } from '@/lib/api';
import type { AuthStatus } from '@/lib/auth';
import { usePalette } from '@/lib/theme';

const CUT = 22;

/** Iniciales del nombre ("Valentina Rueda" → "VR"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0]![0], parts.at(-1)![0]] : [parts[0]?.[0]];
  return letters.join('').toUpperCase();
}

/** La foto que subió (o la de Google); si no hay, las iniciales sobre la marca (texto Noche, 5,3:1). */
export function Avatar({ user, size = 72 }: { user: Pick<AuthUser, 'name' | 'avatarUrl'>; size?: number }) {
  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full bg-brand"
      style={{ width: size, height: size }}
      accessible={false}
    >
      {user.avatarUrl ? (
        <Image source={{ uri: mediaUrl(user.avatarUrl)! }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text className="font-display text-night" style={{ fontSize: size * 0.38 }}>
          {initials(user.name)}
        </Text>
      )}
    </View>
  );
}

/** Encabezado Noche de Perfil: con sesión, la persona; sin sesión, la invitación a ingresar. */
export function ProfileHeader({
  status,
  user,
  onRetry,
}: {
  status: AuthStatus;
  user: AuthUser | null;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const firstName = user?.name.split(/\s+/)[0] ?? '';

  return (
    <View className="overflow-hidden bg-night dark:bg-card" style={{ paddingTop: insets.top + 24 }}>
      <TopoPattern color={palette.brand} opacity={0.22} variant="screen" />
      <View className="gap-4 px-5" style={{ paddingBottom: CUT + 28 }}>
        {status === 'loading' ? (
          <View className="h-40 items-center justify-center">
            <ActivityIndicator color={palette['night-foreground']} accessibilityLabel={t('common.loading')} />
          </View>
        ) : user ? (
          <>
            <View className="flex-row items-center gap-4">
              <Avatar user={user} />
              <View className="flex-1 gap-1">
                <Tape label={t('account.title')} small />
                <Text
                  accessibilityRole="header"
                  className="font-display-italic text-[38px] leading-[40px] uppercase text-night-foreground"
                  numberOfLines={2}
                >
                  {t('account.greeting', { name: firstName })}
                </Text>
              </View>
            </View>
            <Text className="font-sans text-[15px] text-night-foreground/85">{user.email}</Text>
            <View className="flex-row items-center gap-1.5">
              {user.emailVerified ? (
                <CheckCircle size={18} color={palette.success} weight="fill" />
              ) : (
                <Warning size={18} color={palette.accent} weight="fill" />
              )}
              <Text className="font-sans-semibold text-sm text-night-foreground">
                {user.emailVerified ? t('account.verified') : t('account.unverified')}
              </Text>
            </View>
          </>
        ) : (
          <>
            <Tape label={t('nav.profile')} />
            <Text accessibilityRole="header" className="font-display-italic text-[40px] leading-[40px] uppercase text-night-foreground">
              {t('account.signInPromptTitle')}
            </Text>
            <Text className="font-sans text-base leading-6 text-night-foreground/85">
              {status === 'offline' ? t('errors.NETWORK_ERROR') : t('account.signInPromptBody')}
            </Text>
            {status === 'offline' ? (
              <Button label={t('common.retry')} onPress={onRetry} />
            ) : (
              <View className="gap-3">
                <Button label={t('nav.signIn')} onPress={() => router.push('/auth/ingresar')} />
                <Button label={t('nav.signUp')} variant="onNight" onPress={() => router.push('/auth/registro')} />
              </View>
            )}
          </>
        )}
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
  );
}
