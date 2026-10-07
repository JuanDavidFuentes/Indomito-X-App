import '../global.css';
import '@/lib/intl-polyfills';
import '@/lib/i18n';

import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold_Italic,
} from '@expo-google-fonts/barlow-condensed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Uniwind } from 'uniwind';
import { ApiError } from '@/lib/api';
import { AuthProvider, useAuth } from '@/lib/auth';
import { getStoredTheme } from '@/lib/preferences';
import { useColorTheme, usePalette } from '@/lib/theme';

void SplashScreen.preventAutoHideAsync();

// El tema elegido en Perfil se aplica antes del primer render (sin parpadeo).
Uniwind.setTheme(getStoredTheme());

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Un 401/403/404 no se arregla reintentando; un corte de red, sí.
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
      },
    },
  });
}

/** Rutas: pestañas, autenticación (modal), y la cuenta y el panel del Guía, que solo existen con sesión. */
function RootStack() {
  const { status } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Protected guard={status === 'signedIn'}>
        <Stack.Screen name="cuenta" />
        <Stack.Screen name="panel" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorTheme();
  const palette = usePalette();
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.primary,
      background: palette.background,
      card: palette.card,
      text: palette.foreground,
      border: palette.border,
      notification: palette.primary,
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <RootStack />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
