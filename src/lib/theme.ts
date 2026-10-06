import { colors, type ColorRole, type ColorScheme } from '@juandavidfuentes/indomitox-shared/tokens';
import { useUniwind } from 'uniwind';

/** Tema activo según Uniwind (sigue al sistema o a la elección del usuario). */
export function useColorTheme(): ColorScheme {
  const { theme } = useUniwind();
  return theme === 'dark' ? 'dark' : 'light';
}

/**
 * Colores del tema activo para props que no aceptan className
 * (íconos, barra de pestañas, navegación). En el resto se usan clases de Uniwind.
 */
export function usePalette(): Record<ColorRole, string> {
  return colors[useColorTheme()];
}
