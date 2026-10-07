import { Stack } from 'expo-router';

/** Ingreso, registro y recuperación: se abren como modal sobre lo que el usuario estaba viendo. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
