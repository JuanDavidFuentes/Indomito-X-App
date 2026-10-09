import { DISPLAY_CURRENCIES, LOCALES, PHOTO_CREDITS, PHOTO_IDS, type Locale, type MeResponse } from '@juandavidfuentes/indomitox-shared';
import { useQueryClient } from '@tanstack/react-query';
import type { Href } from 'expo-router';
import {
  ArrowSquareOut,
  EnvelopeSimple,
  FirstAidKit,
  IdentificationCard,
  LockKey,
  Mountains,
  SignOut,
  UsersThree,
} from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Uniwind } from 'uniwind';
import { AccountMenu } from '@/components/account/menu';
import { ProfileHeader } from '@/components/account/profile-header';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { HostCard } from '@/components/host/host-card';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { ME_KEY, useMe, useParticipants } from '@/lib/account';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/explore';
import { useErrorText } from '@/lib/forms';
import { getStoredTheme, setStoredTheme, type ThemeChoice } from '@/lib/preferences';
import { useColorTheme, usePalette } from '@/lib/theme';

const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' };

/** Opción seleccionable con estado accesible (radio). */
function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={`min-h-12 flex-1 items-center justify-center rounded-xl border-2 px-3 ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      <Text className={`font-sans-semibold text-base ${selected ? 'text-primary' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

/** Aviso "Verifica tu correo" con reenvío (el enlace se abre en el navegador). */
function VerifyBanner({ email }: { email: string }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await api('/v1/auth/resend-verification', { method: 'POST' });
      Alert.alert(t('auth.verifyTitle'), t('auth.verificationSent'));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_VERIFIED') {
        const me = await queryClient.fetchQuery({ queryKey: ME_KEY, queryFn: () => api<MeResponse>('/v1/me') });
        setUser(me.user);
      } else {
        Alert.alert(t('auth.verifyTitle'), errors.api(error));
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <View accessibilityLiveRegion="polite" className="gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4">
      <View className="flex-row items-start gap-3">
        <EnvelopeSimple size={24} color={palette.warning} weight="duotone" />
        <Text className="flex-1 font-sans-medium text-[15px] leading-[21px] text-foreground">
          {t('auth.verifyBanner', { email })}
        </Text>
      </View>
      <Button label={t('auth.resendVerification')} variant="outline" onPress={resend} loading={sending} />
    </View>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const activeTheme = useColorTheme();
  const palette = usePalette();
  const { status, user, retry, signOut } = useAuth();
  const { data: me } = useMe();
  const { data: participants } = useParticipants();
  const [theme, setTheme] = useState<ThemeChoice>(getStoredTheme);
  const [currency, setCurrency] = useCurrency();
  const signedIn = status === 'signedIn' && user;

  const applyTheme = (choice: ThemeChoice) => {
    setTheme(choice);
    setStoredTheme(choice);
    // Uniwind aplica el tema a las clases y a usePalette() (íconos, pestañas, navegación).
    Uniwind.setTheme(choice);
  };

  const confirmSignOut = () =>
    Alert.alert(t('account.signOut'), user?.email, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.signOut'), style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar style="light" />
      <ScrollView contentContainerClassName="pb-12">
        <ProfileHeader status={status} user={user} onRetry={retry} />

        <View className="gap-8 px-5 pt-2">
          {signedIn ? (
            <>
              {user.emailVerified ? null : <VerifyBanner email={user.email} />}
              <HostCard user={user} />
              <AccountMenu
                items={[
                  {
                    href: '/cuenta/datos',
                    icon: IdentificationCard,
                    label: t('account.sections.profile'),
                    detail: me?.profile.city ?? undefined,
                  },
                  {
                    href: '/cuenta/deportes',
                    icon: Mountains,
                    label: t('account.sections.sports'),
                    detail: me ? t('account.sportsCount', { count: me.profile.favoriteSports.length }) : undefined,
                  },
                  {
                    href: '/cuenta/emergencia',
                    icon: FirstAidKit,
                    label: t('account.sections.emergency'),
                    detail: me?.profile.emergencyContact?.name,
                  },
                  {
                    // Ruta índice de la carpeta participantes/.
                    href: '/cuenta/participantes' as Href,
                    icon: UsersThree,
                    label: t('account.sections.participants'),
                    detail: participants?.map((p) => p.fullName.split(' ')[0]).join(', ') || undefined,
                  },
                  { href: '/cuenta/seguridad', icon: LockKey, label: t('account.sections.security') },
                ]}
              />
            </>
          ) : null}

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

          {/* SRCH-07: moneda del precio aproximado (se cobra siempre en pesos). */}
          <View className="gap-3" accessibilityRole="radiogroup">
            <Text className="font-sans-semibold text-lg text-foreground">{t('currency.label')}</Text>
            <View className="flex-row gap-2">
              {DISPLAY_CURRENCIES.map((option) => (
                <Choice key={option} label={option} selected={currency === option} onPress={() => setCurrency(option)} />
              ))}
            </View>
            <Text className="font-sans text-sm text-muted-foreground">{t('currency.hint')}</Text>
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

          {signedIn ? <Button label={t('account.signOut')} variant="outline" icon={SignOut} onPress={confirmSignOut} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}
