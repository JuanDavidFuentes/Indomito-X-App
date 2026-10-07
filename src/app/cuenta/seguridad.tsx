import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChangePasswordSchema,
  PASSWORD_MIN_LENGTH,
  type ChangePasswordInput,
  type MeResponse,
} from '@juandavidfuentes/indomitox-shared';
import { router } from 'expo-router';
import { Devices, LockKey, SignOut, Trash, Warning } from 'phosphor-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';
import { FormScreen, SavedNote } from '@/components/account/form-screen';
import { Button } from '@/components/ui/button';
import { FormAlert, PasswordField } from '@/components/ui/fields';
import { useMe } from '@/lib/account';
import { api, ApiError, clearTokens } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { applyApiIssues, useErrorText } from '@/lib/forms';
import { usePalette } from '@/lib/theme';

const PROVIDER_NAMES = { GOOGLE: 'Google', APPLE: 'Apple' } as const;

/** Vuelve a Perfil antes de cerrar la sesión: así la ruta protegida no redirige a Explorar. */
const leaveAccount = () => router.dismissTo('/perfil');

export default function SecurityScreen() {
  const { data: me } = useMe();
  if (!me) return <ActivityIndicator className="mt-10" />;
  return <Security me={me} />;
}

function ChangePassword({ me }: { me: MeResponse }) {
  const { t } = useTranslation();
  const errors = useErrorText();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const hasPassword = me.user.hasPassword;
  const provider = me.user.providers[0];
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setSaved(null);
    try {
      await api('/v1/auth/change-password', {
        method: 'POST',
        body: hasPassword ? values : { newPassword: values.newPassword },
      });
      form.reset();
      setSaved(t('account.passwordChanged'));
    } catch (error) {
      if (error instanceof ApiError && error.code === 'PASSWORD_INCORRECT') {
        form.setError('currentPassword', { message: 'errors.PASSWORD_INCORRECT' });
      } else if (!applyApiIssues(error, form.setError)) {
        setFormError(errors.api(error));
      }
    }
  });

  return (
    <View className="gap-5">
      <Text accessibilityRole="header" className="font-display-italic text-2xl uppercase text-foreground">
        {hasPassword ? t('account.changePassword') : t('account.setPassword')}
      </Text>
      {!hasPassword && provider ? (
        <Text className="font-sans text-[15px] text-muted-foreground">
          {t('account.setPasswordHint', { provider: PROVIDER_NAMES[provider] })}
        </Text>
      ) : null}
      {hasPassword ? <PasswordField control={form.control} name="currentPassword" label={t('account.currentPassword')} /> : null}
      <PasswordField
        control={form.control}
        name="newPassword"
        label={t('auth.newPassword')}
        hint={t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        newPassword
      />
      {formError ? <FormAlert message={formError} /> : null}
      <Button
        label={hasPassword ? t('account.changePassword') : t('account.setPassword')}
        variant="outline"
        icon={LockKey}
        onPress={onSubmit}
        loading={form.formState.isSubmitting}
      />
      <SavedNote message={saved} />
    </View>
  );
}

/** AUTH-06: se confirma con la contraseña o, si la cuenta no tiene, escribiendo el correo. */
function DeleteAccount({ me }: { me: MeResponse }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasPassword = me.user.hasPassword;

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await api('/v1/me', {
        method: 'DELETE',
        body: hasPassword ? { password: confirmation } : { confirmEmail: confirmation },
      });
      await clearTokens();
      leaveAccount();
      await signOut();
      Alert.alert(t('account.deleteAccount'), t('account.accountDeleted'));
    } catch (apiError) {
      setError(errors.api(apiError));
      setDeleting(false);
    }
  };

  return (
    <View className="gap-4 rounded-xl border border-destructive/50 p-4">
      <View className="flex-row items-start gap-3">
        <Warning size={24} color={palette.destructive} weight="duotone" />
        <View className="flex-1 gap-1">
          <Text accessibilityRole="header" className="font-display-italic text-2xl uppercase text-foreground">
            {t('account.deleteAccount')}
          </Text>
          <Text className="font-sans text-[15px] leading-[21px] text-muted-foreground">{t('account.deleteAccountHint')}</Text>
        </View>
      </View>
      {open ? (
        <View className="gap-4">
          <Text className="font-sans text-[15px] leading-[21px] text-foreground">{t('account.deleteConfirmBody')}</Text>
          <View className="gap-1.5">
            <Text className="font-sans-semibold text-sm text-foreground">
              {hasPassword ? t('account.deleteConfirmPassword') : t('account.deleteConfirmEmail', { email: me.user.email })}
            </Text>
            <TextInput
              value={confirmation}
              onChangeText={setConfirmation}
              secureTextEntry={hasPassword}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={hasPassword ? 'default' : 'email-address'}
              accessibilityLabel={hasPassword ? t('account.deleteConfirmPassword') : t('account.deleteConfirmEmail', { email: me.user.email })}
              className="h-12 rounded-md border border-input bg-card px-4 font-sans text-base text-foreground"
            />
          </View>
          {error ? <FormAlert message={error} /> : null}
          <Button
            label={t('account.deleteConfirmButton')}
            variant="danger"
            icon={Trash}
            onPress={confirm}
            loading={deleting}
            disabled={confirmation.trim() === ''}
          />
          <Button label={t('common.cancel')} variant="ghost" onPress={() => setOpen(false)} />
        </View>
      ) : (
        <Button label={t('account.deleteAccount')} variant="outline" icon={Trash} onPress={() => setOpen(true)} />
      )}
    </View>
  );
}

function Security({ me }: { me: MeResponse }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const signOutHere = () => {
    leaveAccount();
    void signOut();
  };

  const signOutEverywhere = () =>
    Alert.alert(t('account.signOutAll'), t('account.signOutAllHint'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.signOutAll'),
        style: 'destructive',
        onPress: () => {
          leaveAccount();
          void signOut({ everywhere: true }).then(() => Alert.alert(t('account.signedOutAll')));
        },
      },
    ]);

  return (
    <FormScreen>
      <ChangePassword me={me} />
      <View className="gap-3 border-t border-border pt-6">
        <Button label={t('account.signOut')} variant="outline" icon={SignOut} onPress={signOutHere} />
        <Button label={t('account.signOutAll')} variant="outline" icon={Devices} onPress={signOutEverywhere} />
        <Text className="font-sans text-sm text-muted-foreground">{t('account.signOutAllHint')}</Text>
      </View>
      {/* Zona de peligro: separada y en rojo. */}
      <DeleteAccount me={me} />
    </FormScreen>
  );
}
