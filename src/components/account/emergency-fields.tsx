import type { Control, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/components/ui/fields';

/** Campos del contacto de emergencia; también los usa el formulario de participantes. */
export function EmergencyFields<T extends FieldValues>({
  control,
  names,
}: {
  control: Control<T>;
  names: Record<'name' | 'phone' | 'relationship', Path<T>>;
}) {
  const { t } = useTranslation();
  return (
    <>
      <TextField control={control} name={names.name} label={t('account.emergencyName')} autoCapitalize="words" />
      <TextField
        control={control}
        name={names.phone}
        label={t('account.emergencyPhone')}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
      />
      <TextField
        control={control}
        name={names.relationship}
        label={`${t('account.emergencyRelationship')} (${t('common.optional')})`}
        placeholder={t('account.emergencyRelationshipPlaceholder')}
      />
    </>
  );
}
