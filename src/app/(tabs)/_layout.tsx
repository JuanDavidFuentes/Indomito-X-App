import { Tabs } from 'expo-router/js-tabs';
import {
  CalendarCheck,
  Compass,
  Heart,
  MapTrifold,
  UserCircle,
  type IconProps,
} from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';
import { usePalette } from '@/lib/theme';

type TabIcon = ComponentType<IconProps>;

function icon(Icon: TabIcon) {
  // Pestaña activa en relleno, inactiva en contorno (una sola variante por estado).
  // Los tint colors vienen de los tokens (hex), así que el cast a string es seguro.
  return function TabBarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Icon size={26} color={color as string} weight={focused ? 'fill' : 'regular'} />;
  };
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette['muted-foreground'],
        tabBarStyle: { backgroundColor: palette.card, borderTopColor: palette.border },
        tabBarLabelStyle: { fontFamily: 'Barlow_600SemiBold', fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.explore'), tabBarIcon: icon(Compass) }} />
      <Tabs.Screen name="mapa" options={{ title: t('nav.map'), tabBarIcon: icon(MapTrifold) }} />
      <Tabs.Screen
        name="favoritos"
        options={{ title: t('nav.favorites'), tabBarIcon: icon(Heart) }}
      />
      <Tabs.Screen
        name="reservas"
        options={{ title: t('nav.reservations'), tabBarIcon: icon(CalendarCheck) }}
      />
      <Tabs.Screen name="perfil" options={{ title: t('nav.profile'), tabBarIcon: icon(UserCircle) }} />
    </Tabs>
  );
}
