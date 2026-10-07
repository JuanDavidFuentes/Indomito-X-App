import { LOCALES, PHOTO_CREDITS, PHOTO_IDS, type Locale } from '@juandavidfuentes/indomitox-shared';
import { ArrowSquareOut } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Uniwind } from 'uniwind';
import { TopoPattern } from '@/components/topo-pattern';
import { useColorTheme, usePalette } from '@/lib/theme';

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
  const palette = usePalette();
  const [theme, setTheme] = useState<ThemeChoice>('system');

  const applyTheme = (choice: ThemeChoice) => {
    setTheme(choice);
    // Uniwind aplica el tema a las clases y a usePalette() (íconos, pestañas, navegación).
    Uniwind.setTheme(choice);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <TopoPattern color={palette.primary} opacity={0.1} variant="screen" />
      <ScrollView contentContainerClassName="gap-8 px-5 py-6">
        <Text accessibilityRole="header" className="font-display-italic text-5xl uppercase text-foreground">
          {t('nav.profile')}
        </Text>

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

        {/* Créditos de las fotos: CC BY y CC BY-SA exigen autor, licencia y fuente. */}
        <View className="gap-3">
          <Text className="font-sans-semibold text-lg text-foreground">{t('credits.title')}</Text>
          <Text className="font-sans text-sm text-muted-foreground">{t('credits.intro')}</Text>
          <View className="overflow-hidden rounded-xl border border-border bg-card">
            {PHOTO_IDS.map((id, index) => {
              const credit = PHOTO_CREDITS[id];
              return (
                <Pressable
                  key={id}
                  accessibilityRole="link"
                  accessibilityHint={t('credits.source')}
                  onPress={() => void Linking.openURL(credit.sourceUrl)}
                  className={`min-h-12 flex-row items-center gap-3 px-4 py-3 active:bg-muted ${
                    index > 0 ? 'border-t border-border' : ''
                  }`}
                >
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-sm text-card-foreground">{credit.title}</Text>
                    <Text className="font-sans text-xs text-muted-foreground">
                      {credit.author} · {credit.license}
                      {credit.adapted ? ` · ${t('credits.adapted')}` : ''}
                    </Text>
                  </View>
                  <ArrowSquareOut size={18} color={palette['muted-foreground']} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
