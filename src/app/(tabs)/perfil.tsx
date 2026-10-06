import { LOCALES, type Locale } from '@juandavidfuentes/indomitox-shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import { useColorTheme } from '@/lib/theme';

const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' };
type ThemeChoice = 'system' | 'light' | 'dark';

/** Opción seleccionable con estado accesible (radio). */
function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-12 flex-1 items-center justify-center rounded-xl border-2 px-3 ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <Text
        className={`font-sans-semibold text-base ${selected ? 'text-primary' : 'text-foreground'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const activeTheme = useColorTheme();
  const [theme, setTheme] = useState<ThemeChoice>('system');

  const applyTheme = (choice: ThemeChoice) => {
    setTheme(choice);
    // Uniwind aplica el tema a las clases y a usePalette() (íconos, pestañas, navegación).
    Uniwind.setTheme(choice);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView contentContainerClassName="gap-8 px-5 py-6">
        <Text className="font-display text-4xl uppercase text-foreground">{t('nav.profile')}</Text>

        <View className="gap-3" accessibilityRole="radiogroup">
          <Text className="font-sans-semibold text-lg text-foreground">{t('common.language')}</Text>
          <View className="flex-row gap-2">
            {LOCALES.map((locale) => (
              <Choice
                key={locale}
                label={LOCALE_LABELS[locale]}
                selected={i18n.language === locale}
                onPress={() => void i18n.changeLanguage(locale)}
              />
            ))}
          </View>
        </View>

        <View className="gap-3" accessibilityRole="radiogroup">
          <Text className="font-sans-semibold text-lg text-foreground">
            {t('common.theme')} ({activeTheme === 'dark' ? t('common.themeDark') : t('common.themeLight')})
          </Text>
          <View className="flex-row gap-2">
            <Choice label={t('common.themeSystem')} selected={theme === 'system'} onPress={() => applyTheme('system')} />
            <Choice label={t('common.themeLight')} selected={theme === 'light'} onPress={() => applyTheme('light')} />
            <Choice label={t('common.themeDark')} selected={theme === 'dark'} onPress={() => applyTheme('dark')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
