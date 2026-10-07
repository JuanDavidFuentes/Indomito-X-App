import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export interface ShadeStop {
  /** Posición de 0 a 1. */
  at: number;
  color: string;
  opacity: number;
}

/**
 * Velo en degradado sobre una foto (vertical por defecto) para asegurar el contraste del texto.
 * Se dibuja con react-native-svg: no requiere módulos nativos adicionales.
 */
export function PhotoShade({ stops, horizontal }: { stops: ShadeStop[]; horizontal?: boolean }) {
  const id = `shade-${useId().replace(/:/g, '')}`;
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
          {stops.map((stop) => (
            <Stop key={stop.at} offset={stop.at} stopColor={stop.color} stopOpacity={stop.opacity} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
