import { zodResolver } from '@hookform/resolvers/zod';
import {
  LOCALES,
  SPOKEN_LANGUAGES,
  UpdateProfileSchema,
  type Locale,
  type MeResponse,
  type SpokenLanguage,
} from '@juandavidfuentes/indomitox-shared';
import { useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { FormScreen, SavedNote } from '@/components/account/form-screen';
import { Button } from '@/components/ui/button';
import { Chip, FormAlert, TextField } from '@/components/ui/fields';
import { useMe, useStoreMe } from '@/lib/account';
import { api } from '@/lib/api';
import { applyApiIssues, useErrorText } from '@/lib/forms';

const ProfileFormSchema = UpdateProfileSchema.pick({ name: true, city: true, languages: true, locale: true });

interface ProfileValues {
  name: string;
  city: string;
  languages: SpokenLanguage[];
  locale: Locale;
}

const LOCALE_LABELS: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français' };

/** EXP-02: nombre, ciudad, idiomas que habla e idioma de la cuenta (correos). */
export default function ProfileDataScreen() {
  const { data: me } = useMe();
  if (!me) return <ActivityIndicator className="mt-10" />;
  return <ProfileDataForm me={me} />;
}

function ProfileDataForm({ me }: { me: MeResponse }) {
  const { t } = useTranslation();
  const errors = useErrorText();
  const storeMe = useStoreMe();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(ProfileFormSchema) as unknown as Resolver<ProfileValues>,
    values: { name: me.user.name, city: me.profile.city ?? '', languages: me.profile.languages, locale: me.user.locale },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setSaved(null);
    try {
      storeMe(await api<MeResponse>('/v1/me', { method: 'PATCH', body: values }));
      setSaved(t('account.saved'));
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  return (
    <FormScreen hint={t('account.profileHint')}>
      <TextField control={form.control} name="name" label={t('auth.name')} autoComplete="name" autoCapitalize="words" />
      <TextField
        control={form.control}
        name="city"
        label={t('account.city')}
        placeholder={t('account.cityPlaceholder')}
        autoCapitalize="words"
      />
      <Controller
        control={form.control}
        name="languages"
        render={({ field }) => (
          <View className="gap-2">
            <Text className="font-sans-semibold text-sm text-foreground">{t('account.languages')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {SPOKEN_LANGUAGES.map((language) => {
                const selected = field.value.includes(language);
                return (
                  <Chip
                    key={language}
                    label={t(`spokenLanguages.${language}`)}
                    selected={selected}
                    onPress={() =>
                      field.onChange(selected ? field.value.filter((l) => l !== language) : [...field.value, language])
                    }
                  />
                );
              })}
            </View>
          </View>
        )}
      />
      <Controller
        control={form.control}
        name="locale"
        render={({ field }) => (
          <View className="gap-2" accessibilityRole="radiogroup">
            <Text className="font-sans-semibold text-sm text-foreground">{t('common.language')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {LOCALES.map((locale) => (
                <Chip
                  key={locale}
                  role="radio"
                  label={LOCALE_LABELS[locale]}
                  selected={field.value === locale}
                  onPress={() => field.onChange(locale)}
                />
              ))}
            </View>
          </View>
        )}
      />
      <Text className="font-sans text-sm text-muted-foreground">{t('account.photoSoon')}</Text>
      {formError ? <FormAlert message={formError} /> : null}
      <Button
        label={t('common.save')}
        onPress={onSubmit}
        loading={form.formState.isSubmitting}
        disabled={!form.formState.isDirty}
      />
      <SavedNote message={saved} />
    </FormScreen>
  );
}
