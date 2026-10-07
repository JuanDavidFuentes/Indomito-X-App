import { zodResolver } from '@hookform/resolvers/zod';
import {
  DOCUMENT_TYPES,
  EmergencyContactSchema,
  SavedParticipantSchema,
  type DocumentType,
  type SavedParticipant,
} from '@juandavidfuentes/indomitox-shared';
import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Trash } from 'phosphor-react-native';
import { useState } from 'react';
import { Controller, useForm, type Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { z } from 'zod';
import { EmergencyFields } from '@/components/account/emergency-fields';
import { FormScreen } from '@/components/account/form-screen';
import { Button } from '@/components/ui/button';
import { Chip, FormAlert, TextField } from '@/components/ui/fields';
import { PARTICIPANTS_KEY, useParticipants } from '@/lib/account';
import { api } from '@/lib/api';
import { applyApiIssues, useErrorText } from '@/lib/forms';

/** DD/MM/AAAA (lo que escribe la persona) ⇄ AAAA-MM-DD (lo que guarda la API). */
const toIso = (display: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : display;
};
const toDisplay = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
};
/** Inserta las barras mientras se escribe: "15032014" → "15/03/2014". */
const maskDate = (text: string) => {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
};

/** El contacto de emergencia es opcional: si sus campos van vacíos, se guarda null. */
const ParticipantFormSchema = SavedParticipantSchema.extend({
  birthDate: z.preprocess((value) => toIso(String(value ?? '')), SavedParticipantSchema.shape.birthDate),
  emergencyContact: z.preprocess((value) => {
    const contact = value as { name?: string; phone?: string; relationship?: string } | null | undefined;
    return contact && [contact.name, contact.phone, contact.relationship].some((v) => v?.trim()) ? contact : null;
  }, EmergencyContactSchema.nullable()),
});

interface ParticipantForm {
  fullName: string;
  documentType: DocumentType;
  documentNumber: string;
  birthDate: string;
  emergencyContact: { name: string; phone: string; relationship: string };
}

export default function ParticipantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: participants } = useParticipants();
  const { t } = useTranslation();
  if (id !== 'nuevo' && !participants) return <ActivityIndicator className="mt-10" />;
  const participant = participants?.find((p) => p.id === id);
  return (
    <>
      <Stack.Screen options={{ title: participant ? t('account.editParticipant') : t('account.addParticipant') }} />
      <ParticipantFormView participant={participant} />
    </>
  );
}

function ParticipantFormView({ participant }: { participant?: SavedParticipant }) {
  const { t } = useTranslation();
  const errors = useErrorText();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const form = useForm<ParticipantForm>({
    resolver: zodResolver(ParticipantFormSchema) as unknown as Resolver<ParticipantForm>,
    defaultValues: {
      fullName: participant?.fullName ?? '',
      documentType: participant?.documentType ?? 'CC',
      documentNumber: participant?.documentNumber ?? '',
      birthDate: participant ? toDisplay(participant.birthDate) : '',
      emergencyContact: {
        name: participant?.emergencyContact?.name ?? '',
        phone: participant?.emergencyContact?.phone ?? '',
        relationship: participant?.emergencyContact?.relationship ?? '',
      },
    },
    mode: 'onTouched',
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const body = ParticipantFormSchema.parse(values);
      const saved = participant
        ? await api<SavedParticipant>(`/v1/me/participants/${participant.id}`, { method: 'PUT', body })
        : await api<SavedParticipant>('/v1/me/participants', { method: 'POST', body });
      queryClient.setQueryData<SavedParticipant[]>(PARTICIPANTS_KEY, (list = []) =>
        participant ? list.map((p) => (p.id === saved.id ? saved : p)) : [...list, saved],
      );
      router.back();
    } catch (error) {
      if (!applyApiIssues(error, form.setError)) setFormError(errors.api(error));
    }
  });

  const remove = () => {
    if (!participant) return;
    Alert.alert(t('account.deleteParticipant'), t('account.deleteParticipantConfirm', { name: participant.fullName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await api(`/v1/me/participants/${participant.id}`, { method: 'DELETE' });
            queryClient.setQueryData<SavedParticipant[]>(PARTICIPANTS_KEY, (list = []) =>
              list.filter((p) => p.id !== participant.id),
            );
            router.back();
          } catch (error) {
            setFormError(errors.api(error));
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <FormScreen>
      <TextField control={form.control} name="fullName" label={t('account.fullName')} autoCapitalize="words" />
      <Controller
        control={form.control}
        name="documentType"
        render={({ field }) => (
          <View className="gap-2" accessibilityRole="radiogroup">
            <Text className="font-sans-semibold text-sm text-foreground">{t('account.documentType')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {DOCUMENT_TYPES.map((type) => (
                <Chip
                  key={type}
                  role="radio"
                  label={t(`documentTypes.${type}`)}
                  selected={field.value === type}
                  onPress={() => field.onChange(type)}
                />
              ))}
            </View>
          </View>
        )}
      />
      <TextField
        control={form.control}
        name="documentNumber"
        label={t('account.documentNumber')}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <TextField
        control={form.control}
        name="birthDate"
        label={t('account.birthDate')}
        placeholder={t('account.birthDatePlaceholder')}
        keyboardType="number-pad"
        maxLength={10}
        transform={maskDate}
      />
      <View className="gap-4">
        <Text className="font-sans-semibold text-base text-foreground">{t('account.participantEmergency')}</Text>
        <EmergencyFields
          control={form.control}
          names={{
            name: 'emergencyContact.name',
            phone: 'emergencyContact.phone',
            relationship: 'emergencyContact.relationship',
          }}
        />
      </View>
      {formError ? <FormAlert message={formError} /> : null}
      <Button label={t('common.save')} onPress={onSubmit} loading={form.formState.isSubmitting} />
      {participant ? (
        <Button label={t('account.deleteParticipant')} variant="ghost" icon={Trash} onPress={remove} loading={deleting} />
      ) : null}
    </FormScreen>
  );
}
