import { zodResolver } from '@hookform/resolvers/zod';
import {
  PASSWORD_MIN_LENGTH,
  RegisterSchema,
  SIGNUP_INTENTS,
  webUrl,
  type AuthResponse,
  type RegisterInput,
  type WebPathname,
} from '@juandavidfuentes/indomitox-shared';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Compass, Mountains } from 'phosphor-react-native';
import { useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormAlert, PasswordField, TextField } from '@/components/ui/fields';
import { api, WEB_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { currentLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/theme';

/** Las casillas empiezan sin marcar; el esquema exige que lleguen en true. */
type RegisterForm = Omit<RegisterInput, 'acceptTerms' | 'acceptPrivacy'> & { acceptTerms: boolean; acceptPrivacy: boolean };

const INTENT_ICON = { EXPLORE: Compass, HOST: Mountains } as const;
const INTENT_TEXT = {
  EXPLORE: { title: 'auth.intentExplore', hint: 'auth.intentExploreHint' },
  HOST: { title: 'auth.intentHost', hint: 'auth.intentHostHint' },
} as const;

/** AUTH-02, AUTH-04 y AUTH-08 en la app. */
export default function SignUpScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterSchema) as unknown as Resolver<RegisterForm>,
    defaultValues: {
      intent: 'EXPLORE',
      name: '',
      email: '',
      password: '',
      locale: currentLocale(),
      acceptTerms: false,
      acceptPrivacy: false,
    },
    mode: 'onTouched',
  });

  const openDocument = (pathname: WebPathname) => void WebBrowser.openBrowserAsync(webUrl(WEB_URL, pathname, currentLocale()));
  const docLink = (pathname: WebPathname) => (
    <Text accessibilityRole="link" onPress={() => openDocument(pathname)} className="font-sans-semibold text-secondary">
      {t('common.readDocument')}
    </Text>
  );

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(await api<AuthResponse>('/v1/auth/register', { method: 'POST', body: values }));
      // Perfil muestra el aviso "Verifica tu correo" (y el alta de Guía, si la eligió).
      if (router.canGoBack()) router.back();
      else router.replace('/perfil');
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  return (
    <AuthScreen
      photo="agua-rafting-fonce"
      eyebrow={t('auth.signUpEyebrow')}
      title={t('auth.signUpTitle')}
      subtitle={t('auth.signUpSubtitle')}
    >
      <View className="gap-5">
        <Controller
          control={form.control}
          name="intent"
          render={({ field }) => (
            <View className="gap-2" accessibilityRole="radiogroup">
              <Text className="font-sans-semibold text-sm text-foreground">{t('auth.intentTitle')}</Text>
              {SIGNUP_INTENTS.map((intent) => {
                const selected = field.value === intent;
                const Icon = INTENT_ICON[intent];
                return (
                  <Pressable
                    key={intent}
                    onPress={() => field.onChange(intent)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityHint={t(INTENT_TEXT[intent].hint)}
                    className={`flex-row items-center gap-3 rounded-xl border-2 p-4 ${
                      selected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                    }`}
                  >
                    <Icon size={28} color={palette.primary} weight={selected ? 'fill' : 'regular'} />
                    <View className="flex-1 gap-0.5">
                      <Text className="font-display text-lg uppercase text-foreground">{t(INTENT_TEXT[intent].title)}</Text>
                      <Text className="font-sans text-sm text-muted-foreground">{t(INTENT_TEXT[intent].hint)}</Text>
                    </View>
                    <View
                      className={`size-6 items-center justify-center rounded-full border-2 ${
                        selected ? 'border-primary' : 'border-input'
                      }`}
                    >
                      {selected ? <View className="size-3 rounded-full bg-primary" /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        />
        <TextField
          control={form.control}
          name="name"
          label={t('auth.name')}
          placeholder={t('auth.namePlaceholder')}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
        />
        <TextField
          control={form.control}
          name="email"
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <PasswordField
          control={form.control}
          name="password"
          label={t('auth.password')}
          hint={t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH })}
          newPassword
        />
        <CheckboxField control={form.control} name="acceptTerms" label={t('auth.acceptTerms')} link={docLink('/legal/terminos')} />
        <CheckboxField
          control={form.control}
          name="acceptPrivacy"
          label={t('auth.acceptPrivacy')}
          link={docLink('/legal/privacidad')}
        />
        {formError ? <FormAlert message={formError} /> : null}
        <Button label={t('auth.submitSignUp')} onPress={onSubmit} loading={form.formState.isSubmitting} />
        <View className="flex-row flex-wrap items-center justify-center gap-1 pt-2">
          <Text className="font-sans text-[15px] text-muted-foreground">{t('auth.haveAccount')}</Text>
          <Text
            accessibilityRole="link"
            onPress={() => router.replace('/auth/ingresar')}
            className="py-2 font-sans-semibold text-[15px] text-primary"
          >
            {t('auth.goSignIn')}
          </Text>
        </View>
      </View>
    </AuthScreen>
  );
}
