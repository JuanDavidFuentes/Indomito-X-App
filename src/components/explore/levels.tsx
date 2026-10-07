import { DIFFICULTIES } from '@juandavidfuentes/indomitox-shared';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { DifficultyShape } from '@/components/difficulty';

/** Escala de dificultad estilo pistas de esquí: forma + color + texto. */
export function Levels() {
  const { t } = useTranslation();

  return (
    <View className="flex-row flex-wrap gap-3 px-5">
      {DIFFICULTIES.map((level) => (
        <View key={level} className="w-[47%] grow gap-1.5 rounded-xl border border-border bg-card p-4">
          <DifficultyShape level={level} size={18} />
          <Text className="mt-1 font-display text-xl uppercase text-card-foreground">{t(`difficulty.${level}`)}</Text>
          <Text className="font-sans text-sm leading-5 text-muted-foreground">{t(`home.levels.${level}`)}</Text>
        </View>
      ))}
    </View>
  );
}
