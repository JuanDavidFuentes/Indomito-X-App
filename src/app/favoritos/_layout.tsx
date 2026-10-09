import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePalette } from '@/lib/theme';

/** Una lista de favoritos y "Guardar en una lista" (solo con sesión: el layout raíz las protege). */
export default function FavoritesLayout() {
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
      <Stack.Screen name="[id]" options={{ title: t('favorites.title') }} />
      <Stack.Screen name="guardar" options={{ title: t('favorites.saveTo'), presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
