import { zodResolver } from '@hookform/resolvers/zod';
import { EmergencyContactSchema, type EmergencyContactInput, type MeResponse } from '@juandavidfuentes/indomitox-shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text } from 'react-native';
import { EmergencyFields } from '@/components/account/emergency-fields';
import { FormScreen, SavedNote } from '@/components/account/form-screen';
import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/fields';
import { useMe, useStoreMe } from '@/lib/account';
import { api } from '@/lib/api';
import { applyApiIssues, useErrorText } from '@/lib/forms';

export default function EmergencyContactScreen() {
  const { data: me } = useMe();
  if (!me) return <ActivityIndicator className="mt-10" />;
  return <EmergencyForm me={me} />;
}

function EmergencyForm({ me }: { me: MeResponse }) {
  const { t } = useTranslation();
  const errors = useErrorText();
  const storeMe = useStoreMe();
  const contact = me.profile.emergencyContact;
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const form = useForm<EmergencyContactInput>({
    resolver: zodResolver(EmergencyContactSchema),
    values: { name: contact?.name ?? '', phone: contact?.phone ?? '', relationship: contact?.relationship ?? '' },
    mode: 'onTouched',
  });

  const save = (emergencyContact: EmergencyContactInput | null) =>
    api<MeResponse>('/v1/me', { method: 'PATCH', body: { emergencyContact } });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    setSaved(null);
    try {
      storeMe(await save(values));
      setSaved(t('account.saved'));
    } catch (error) {
      // La API los devuelve como `emergencyContact.campo`.
      const mapped = applyApiIssues(error, (path, value) =>
        form.setError(String(path).replace(/^emergencyContact\./, '') as never, value),
      );
      if (!mapped) setFormError(errors.api(error));
    }
  });

  const remove = async () => {
    setRemoving(true);
    try {
      storeMe(await save(null));
      setSaved(t('account.saved'));
    } catch (error) {
      setFormError(errors.api(error));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <FormScreen hint={t('account.emergencyHint')}>
      {contact ? null : <Text className="font-sans text-base text-muted-foreground">{t('account.emergencyEmpty')}</Text>}
      <EmergencyFields control={form.control} names={{ name: 'name', phone: 'phone', relationship: 'relationship' }} />
      {formError ? <FormAlert message={formError} /> : null}
      <Button label={t('common.save')} onPress={onSubmit} loading={form.formState.isSubmitting} disabled={!form.formState.isDirty} />
      {contact ? <Button label={t('account.removeContact')} variant="ghost" onPress={remove} loading={removing} /> : null}
      <SavedNote message={saved} />
    </FormScreen>
  );
}
