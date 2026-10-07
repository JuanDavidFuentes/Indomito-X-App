import type { IconProps } from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { ActivityIndicator, Text, View, type PressableProps } from 'react-native';
import { PressableScale } from '@/components/pressable-scale';
import { usePalette } from '@/lib/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'onNight';

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary',
  outline: 'border-2 border-border bg-card',
  ghost: 'bg-transparent',
  danger: 'bg-destructive',
  // Contorno claro sobre superficies Noche (hero de Perfil y de autenticación).
  onNight: 'border-2 border-night-foreground/70 bg-transparent',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  outline: 'text-foreground',
  ghost: 'text-primary',
  danger: 'text-destructive-foreground',
  onNight: 'text-night-foreground',
};

/**
 * Botón de la app: 48 dp de alto (MASTER §12), resorte al presionar (PressableScale) y estado
 * de carga que lo deshabilita. Un solo botón `primary` por pantalla.
 */
export function Button({
  label,
  variant = 'primary',
  icon: Icon,
  loading = false,
  disabled,
  className,
  ...props
}: Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: Variant;
  icon?: ComponentType<IconProps>;
  loading?: boolean;
  className?: string;
}) {
  const palette = usePalette();
  const color: Record<Variant, string> = {
    primary: palette['primary-foreground'],
    outline: palette.foreground,
    ghost: palette.primary,
    danger: palette['destructive-foreground'],
    onNight: palette['night-foreground'],
  };
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      {...props}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      pressedScale={0.97}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-5 py-3 ${CONTAINER[variant]} ${
        isDisabled ? 'opacity-50' : ''
      } ${className ?? ''}`}
    >
      {loading ? (
        <ActivityIndicator color={color[variant]} />
      ) : Icon ? (
        <View>
          <Icon size={20} color={color[variant]} weight="bold" />
        </View>
      ) : null}
      <Text className={`text-center font-sans-semibold text-base ${LABEL[variant]}`}>{label}</Text>
    </PressableScale>
  );
}
