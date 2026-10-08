import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/lib/theme';

/**
 * Panel del Guía en la app (solo con sesión: el layout raíz lo protege). El aviso MOB-02 se
 * abre como modal antes del panel; publicaciones y calendario llevan el encabezado nativo.
 */
export default function PanelLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="aviso" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="publicaciones/index" options={{ title: t('listings.title') }} />
      <Stack.Screen name="publicaciones/[id]" options={{ title: '' }} />
      <Stack.Screen name="calendario" options={{ title: t('calendar.title') }} />
    </Stack>
  );
}
