import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type AuthResponse, type LoginInput } from '@juandavidfuentes/indomitox-shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { FormAlert, PasswordField, TextField } from '@/components/ui/fields';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { applyApiIssues, useErrorText } from '@/lib/forms';

export default function SignInScreen() {
  const { t } = useTranslation();
  const errors = useErrorText();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(await api<AuthResponse>('/v1/auth/login', { method: 'POST', body: values }));
      // AUTH-07: vuelve a la pantalla desde la que se pidió la cuenta.
      if (router.canGoBack()) router.back();
      else router.replace('/perfil');
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  return (
    <AuthScreen
      photo="aire-parapente-san-gil"
      eyebrow={t('auth.signInEyebrow')}
      title={t('auth.signInTitle')}
      subtitle={t('auth.signInSubtitle')}
    >
      <View className="gap-5">
        <TextField
          control={form.control}
          name="email"
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <PasswordField control={form.control} name="password" label={t('auth.password')} onSubmitEditing={onSubmit} />
        <Text
          accessibilityRole="link"
          onPress={() => router.push('/auth/recuperar')}
          className="self-end py-2 font-sans-semibold text-[15px] text-secondary"
        >
          {t('auth.forgotLink')}
        </Text>
        {formError ? <FormAlert message={formError} /> : null}
        <Button label={t('auth.submitSignIn')} onPress={onSubmit} loading={form.formState.isSubmitting} />
        <View className="flex-row flex-wrap items-center justify-center gap-1 pt-2">
          <Text className="font-sans text-[15px] text-muted-foreground">{t('auth.noAccount')}</Text>
          <Text
            accessibilityRole="link"
            onPress={() => router.replace('/auth/registro')}
            className="py-2 font-sans-semibold text-[15px] text-primary"
          >
            {t('auth.goSignUp')}
          </Text>
        </View>
      </View>
    </AuthScreen>
  );
}
