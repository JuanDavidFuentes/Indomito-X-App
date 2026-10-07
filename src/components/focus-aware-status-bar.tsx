import { useIsFocused } from 'expo-router';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';

/**
 * Barra de estado que solo aplica mientras la pantalla está enfocada.
 * Las pestañas siguen montadas al cambiar de pestaña; montar el componente solo con foco
 * hace que al salir vuelva a regir la barra del layout raíz.
 * Uso: pantallas que empiezan con un hero "Noche" → <FocusAwareStatusBar style="light" />.
 */
export function FocusAwareStatusBar({ style }: { style: StatusBarStyle }) {
  const isFocused = useIsFocused();
  return isFocused ? <StatusBar style={style} /> : null;
}
