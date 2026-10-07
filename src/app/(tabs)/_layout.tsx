import { colors } from '@juandavidfuentes/indomitox-shared/tokens';
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
import { View, type ColorValue } from 'react-native';

type TabIcon = ComponentType<IconProps>;

// La barra de pestañas es "Noche" en ambos temas: sus colores salen siempre del tema oscuro.
const BAR = colors.dark;

function icon(Icon: TabIcon) {
  // Pestaña activa: ícono relleno sobre una píldora Lava; inactiva: contorno.
  // Los tint colors vienen de los tokens (hex), así que el cast a string es seguro.
  return function TabBarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View
        style={{
          width: 52,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? BAR.brand : 'transparent',
        }}
      >
        <Icon size={22} color={color as string} weight={focused ? 'fill' : 'regular'} />
      </View>
    );
  };
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BAR['night-foreground'],
        tabBarInactiveTintColor: BAR['muted-foreground'],
        tabBarStyle: { backgroundColor: BAR.night, borderTopColor: BAR.border },
        tabBarLabelStyle: { fontFamily: 'Barlow_600SemiBold', fontSize: 12, marginTop: 2 },
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
