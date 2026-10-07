import { StyleSheet } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';

/**
 * Curvas de nivel (sello de la marca). Mismo algoritmo que web/src/components/brand/topo-pattern.tsx;
 * los trazos se calculan una sola vez al cargar el módulo.
 */
type Peak = readonly [cx: number, cy: number, rings: number, step: number, seed: number];

/** Lienzos verticales de 400 × 800 pensados para pantallas de teléfono. */
const VARIANTS = {
  hero: [
    [80, 180, 9, 24, 0.4],
    [360, 620, 10, 24, 1.7],
  ],
  screen: [
    [90, 170, 8, 24, 1.1],
    [330, 640, 9, 24, 2.4],
  ],
} satisfies Record<string, readonly Peak[]>;

export type TopoVariant = keyof typeof VARIANTS;

function contour([cx, cy, , step, seed]: Peak, ring: number): string {
  const base = step * (ring + 1);
  const coords: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    const wobble =
      1 +
      0.14 * Math.sin(3 * t + seed + ring * 0.35) +
      0.07 * Math.sin(5 * t + seed * 2) +
      0.04 * Math.cos(7 * t + ring * 0.2);
    const r = base * wobble;
    coords.push(`${(cx + r * Math.cos(t) * 1.35).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${coords.join(' L')}Z`;
}

const PATHS = Object.fromEntries(
  Object.entries(VARIANTS).map(([name, peaks]) => [
    name,
    peaks.flatMap((peak) => Array.from({ length: peak[2] }, (_, ring) => contour(peak, ring))),
  ]),
) as Record<TopoVariant, string[]>;

/** Textura decorativa a pantalla completa del contenedor (no recibe toques). */
export function TopoPattern({
  color,
  opacity = 0.3,
  variant = 'hero',
}: {
  color: string;
  opacity?: number;
  variant?: TopoVariant;
}) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
      accessible={false}
    >
      <G fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={1.2}>
        {PATHS[variant].map((d, index) => (
          <Path key={index} d={d} />
        ))}
      </G>
    </Svg>
  );
}
