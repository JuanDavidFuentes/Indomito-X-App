import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@juandavidfuentes/indomitox-shared';
import { router } from 'expo-router';
import { EnvelopeSimpleOpen } from 'phosphor-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { AuthScreen } from '@/components/auth/auth-screen';
import { Button } from '@/components/ui/button';
import { FormAlert, TextField } from '@/components/ui/fields';
import { api } from '@/lib/api';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { currentLocale } from '@/lib/i18n';
import { usePalette } from '@/lib/theme';

/** Se llega desde Ingresar: volver es cerrar esta pantalla. */
const backToSignIn = () => (router.canGoBack() ? router.back() : router.replace('/auth/ingresar'));

/**
 * Pide el enlace de recuperación. La contraseña nueva se crea en la web, desde el enlace del
 * correo (que se abre en el navegador del teléfono).
 */
export default function RecoverPasswordScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '', locale: currentLocale() },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await api('/v1/auth/forgot-password', { method: 'POST', body: values });
      setSentTo(values.email.trim());
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  return (
    <AuthScreen photo="tierra-escalada" eyebrow={t('auth.signInEyebrow')} title={t('auth.forgotTitle')}>
      {sentTo ? (
        <View className="gap-5" accessibilityLiveRegion="polite">
          <View className="flex-row items-start gap-3">
            <EnvelopeSimpleOpen size={32} color={palette.secondary} weight="duotone" />
            <Text className="flex-1 font-sans text-lg leading-7 text-foreground">{t('auth.forgotSent', { email: sentTo })}</Text>
          </View>
          <Button label={t('auth.backToSignIn')} variant="outline" onPress={backToSignIn} />
        </View>
      ) : (
        <View className="gap-5">
          <Text className="font-sans text-base leading-6 text-muted-foreground">{t('auth.forgotSubtitle')}</Text>
          <TextField
            control={form.control}
            name="email"
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={onSubmit}
          />
          {formError ? <FormAlert message={formError} /> : null}
          <Button label={t('auth.forgotSubmit')} onPress={onSubmit} loading={form.formState.isSubmitting} />
          <Text
            accessibilityRole="link"
            onPress={backToSignIn}
            className="self-center py-2 font-sans-semibold text-[15px] text-primary"
          >
            {t('auth.backToSignIn')}
          </Text>
        </View>
      )}
    </AuthScreen>
  );
}
