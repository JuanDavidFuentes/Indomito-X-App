import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/lib/theme';

/** Secciones de "Mi cuenta" (solo con sesión: el layout raíz las protege con Stack.Protected). */
export default function AccountLayout() {
  const { t } = useTranslation();
  const palette = usePalette();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.foreground,
        headerTitleStyle: { fontFamily: 'BarlowCondensed_700Bold', fontSize: 24 },
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="datos" options={{ title: t('account.sections.profile') }} />
      <Stack.Screen name="deportes" options={{ title: t('account.sections.sports') }} />
      <Stack.Screen name="emergencia" options={{ title: t('account.sections.emergency') }} />
      <Stack.Screen name="participantes/index" options={{ title: t('account.sections.participants') }} />
      <Stack.Screen name="participantes/[id]" options={{ title: t('account.editParticipant') }} />
      <Stack.Screen name="seguridad" options={{ title: t('account.sections.security') }} />
    </Stack>
  );
}
