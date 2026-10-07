import { SPORT_ELEMENTS, type SportElement } from '@juandavidfuentes/indomitox-shared';
import type { ColorRole } from '@juandavidfuentes/indomitox-shared/tokens';
import {
  Flashlight,
  Lightning,
  MagnifyingGlass,
  MapPin,
  Mountains,
  Waves,
  Wind,
  type IconProps,
} from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { usePalette } from '@/lib/theme';

const ELEMENTS: Record<
  SportElement,
  { icon: ComponentType<IconProps>; bg: string; fg: string; fgRole: ColorRole }
> = {
  WATER: { icon: Waves, bg: 'bg-secondary', fg: 'text-secondary-foreground', fgRole: 'secondary-foreground' },
  AIR: { icon: Wind, bg: 'bg-accent', fg: 'text-accent-foreground', fgRole: 'accent-foreground' },
  LAND: { icon: Mountains, bg: 'bg-primary', fg: 'text-primary-foreground', fgRole: 'primary-foreground' },
  UNDERGROUND: {
    icon: Flashlight,
    bg: 'bg-night border border-border',
    fg: 'text-night-foreground',
    fgRole: 'night-foreground',
  },
  PARK: {
    icon: Lightning,
    bg: 'bg-adrenaline',
    fg: 'text-adrenaline-foreground',
    fgRole: 'adrenaline-foreground',
  },
};

export default function ExploreScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="pb-10">
      <FocusAwareStatusBar style="light" />
      {/* Hero "Noche" */}
      <View className="bg-night px-5 pb-8" style={{ paddingTop: insets.top + 24 }}>
        <Text className="font-display-semibold text-xs uppercase tracking-[3px] text-accent">
          {t('home.heroEyebrow')}
        </Text>
        <Text className="mt-3 font-display text-5xl uppercase leading-[46px] text-night-foreground">
          {t('home.heroTitle')}
        </Text>
        <Text className="mt-4 font-sans text-base leading-6 text-night-foreground/85">
          {t('home.heroSubtitle')}
        </Text>

        <View className="mt-6 gap-3 rounded-2xl bg-card p-3">
          <View className="flex-row items-center gap-2 px-2">
            <MapPin size={20} color={palette['muted-foreground']} />
            <TextInput
              accessibilityLabel={t('home.searchLabel')}
              placeholder={t('home.searchPlaceholder')}
              placeholderTextColor={palette['muted-foreground']}
              className="h-12 flex-1 font-sans text-base text-card-foreground"
              returnKeyType="search"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-primary active:opacity-85"
          >
            <MagnifyingGlass size={20} color={palette['primary-foreground']} weight="bold" />
            <Text className="font-sans-semibold text-base text-primary-foreground">
              {t('home.searchButton')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Elementos */}
      <View className="px-5 pt-8">
        <Text className="font-display text-4xl uppercase text-foreground">
          {t('home.elementsTitle')}
        </Text>
        <Text className="mt-2 font-sans text-base text-muted-foreground">
          {t('home.elementsSubtitle')}
        </Text>
        <View className="mt-5 flex-row flex-wrap gap-3">
          {SPORT_ELEMENTS.map((element, index) => {
            const { icon: Icon, bg, fg, fgRole } = ELEMENTS[element];
            const isLast = index === SPORT_ELEMENTS.length - 1;
            return (
              <View
                key={element}
                className={`min-h-36 justify-between rounded-2xl p-4 ${bg} ${isLast ? 'w-full' : 'w-[48%] grow'}`}
              >
                <Icon size={32} color={palette[fgRole]} weight="duotone" />
                <View>
                  <Text className={`font-display text-2xl uppercase ${fg}`}>
                    {t(`elements.${element}`)}
                  </Text>
                  <Text className={`mt-1 font-sans-medium text-xs ${fg}`}>
                    {t(`home.elementExamples.${element}`)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}
