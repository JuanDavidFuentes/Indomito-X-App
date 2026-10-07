import { Stack } from 'expo-router';

/**
 * Panel del Guía en la app (solo con sesión: el layout raíz lo protege). El aviso MOB-02 se
 * abre como modal antes del panel.
 */
export default function PanelLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="aviso" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
