import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { usePalette } from '@/lib/theme';

/**
 * Marca "Cumbre" (shared/design-system/indomito-x/marca/marca.svg): la X es una persona con los
 * brazos en alto cuyo cuerpo es la montaña; el sol es la cabeza y el hueco de la base, el sendero.
 */
export function LogoMark({ size = 28, mono }: { size?: number; mono?: string }) {
  const palette = usePalette();
  const body = mono ?? palette.brand;
  const sun = mono ?? palette.accent;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <Path d="M2 61 L32 24 L62 61 Z M22 61 L32 49 L42 61 Z" fill={body} fillRule="evenodd" />
      <Path d="M32 30 L11 8 M32 30 L53 8" fill="none" stroke={body} strokeWidth={10} strokeLinecap="round" />
      <Circle cx={32} cy={9.5} r={7} fill={sun} />
    </Svg>
  );
}

/** Logotipo: marca + "INDÓMITO X" en Barlow Condensed 800 itálica. */
export function Logo({ size = 26, textClassName = 'text-foreground' }: { size?: number; textClassName?: string }) {
  return (
    <View className="flex-row items-center gap-2" accessible accessibilityLabel="Indómito X">
      <LogoMark size={size} />
      <Text className={`font-display-italic text-[22px] uppercase ${textClassName}`}>
        Indómito <Text className="text-brand">X</Text>
      </Text>
    </View>
  );
}

/** Etiqueta tipo cinta adhesiva (Sol, rotada 2°). */
export function Tape({ label, small, align = 'start' }: { label: string; small?: boolean; align?: 'start' | 'center' }) {
  return (
    <View
      className={`bg-accent ${align === 'center' ? 'self-center' : 'self-start'}`}
      style={{
        transform: [{ rotate: '-2deg' }],
        paddingHorizontal: small ? 8 : 10,
        paddingVertical: small ? 5 : 7,
        boxShadow: '0 3px 0 rgba(0,0,0,0.25)',
      }}
    >
      <Text
        className="font-display uppercase text-accent-foreground"
        style={{ fontSize: small ? 10 : 12, letterSpacing: small ? 1.6 : 2.2 }}
      >
        {label}
      </Text>
    </View>
  );
}
