import { HOME_SPORTS } from '@juandavidfuentes/indomitox-shared';
import { X } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { usePalette } from '@/lib/theme';

/** Cinta de deportes cruzada a 2° (decorativa y quieta en la app; los nombres se leen una vez). */
export function SportBand() {
  const { t } = useTranslation();
  const palette = usePalette();

  return (
    <View className="-mt-10 overflow-hidden py-4" style={{ zIndex: 2 }}>
      <View
        className="flex-row items-center bg-brand py-2.5"
        style={{
          width: '130%',
          marginLeft: '-12%',
          transform: [{ rotate: '-2deg' }],
          boxShadow: `0 5px 0 ${palette.night}`,
        }}
        accessibilityLabel={HOME_SPORTS.map((sport) => t(`sports.${sport}`)).join(', ')}
        accessible
      >
        {HOME_SPORTS.map((sport) => (
          <View key={sport} className="flex-row items-center">
            <Text className="px-3 font-display-italic text-[22px] uppercase text-night">{t(`sports.${sport}`)}</Text>
            <X size={16} weight="bold" color={palette['night-foreground']} />
          </View>
        ))}
      </View>
    </View>
  );
}
