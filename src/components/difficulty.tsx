import type { Difficulty } from '@juandavidfuentes/indomitox-shared';
import type { ColorRole } from '@juandavidfuentes/indomitox-shared/tokens';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { usePalette } from '@/lib/theme';

const ROLE: Record<Difficulty, ColorRole> = {
  BEGINNER: 'difficulty-beginner',
  INTERMEDIATE: 'difficulty-intermediate',
  ADVANCED: 'difficulty-advanced',
  EXPERT: 'difficulty-expert',
};

/** Forma estilo pistas de esquí (● ■ ◆ ◆◆): acompaña siempre al color y al texto. */
export function DifficultyShape({ level, size = 12 }: { level: Difficulty; size?: number }) {
  const color = usePalette()[ROLE[level]];
  const diamond = (x: number) => (
    <Rect x={x + 2.2} y={2.2} width={7.6} height={7.6} rx={0.8} fill={color} transform={`rotate(45 ${x + 6} 6)`} />
  );
  const expert = level === 'EXPERT';
  return (
    <Svg width={expert ? size * 2 : size} height={size} viewBox={expert ? '0 0 24 12' : '0 0 12 12'} accessible={false}>
      {level === 'BEGINNER' && <Circle cx={6} cy={6} r={5} fill={color} />}
      {level === 'INTERMEDIATE' && <Rect x={1.5} y={1.5} width={9} height={9} rx={1} fill={color} />}
      {level === 'ADVANCED' && diamond(0)}
      {expert && (
        <>
          {diamond(0)}
          {diamond(12)}
        </>
      )}
    </Svg>
  );
}

/** Insignia de dificultad sobre foto. */
export function DifficultyBadge({ level }: { level: Difficulty }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-full bg-background px-2.5 py-1">
      <DifficultyShape level={level} size={10} />
      <Text className="font-sans-bold text-xs text-foreground">{t(`difficulty.${level}`)}</Text>
    </View>
  );
}
