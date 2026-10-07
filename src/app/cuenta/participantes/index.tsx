import { ageOn, maskDocument } from '@juandavidfuentes/indomitox-shared';
import { router } from 'expo-router';
import { CaretRight, Plus } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { FormScreen } from '@/components/account/form-screen';
import { Button } from '@/components/ui/button';
import { useParticipants } from '@/lib/account';
import { usePalette } from '@/lib/theme';

/** EXP-02: participantes frecuentes. El número de documento se muestra enmascarado. */
export default function ParticipantsScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const { data: participants, isPending } = useParticipants();

  return (
    <FormScreen hint={t('account.participantsHint')}>
      <Button
        label={t('account.addParticipant')}
        variant="outline"
        icon={Plus}
        onPress={() => router.push({ pathname: '/cuenta/participantes/[id]', params: { id: 'nuevo' } })}
      />
      {isPending ? (
        <ActivityIndicator />
      ) : participants?.length ? (
        <View className="overflow-hidden rounded-xl border border-border bg-card">
          {participants.map((participant, index) => (
            <Pressable
              key={participant.id}
              onPress={() => router.push({ pathname: '/cuenta/participantes/[id]', params: { id: participant.id } })}
              accessibilityRole="button"
              accessibilityHint={t('common.edit')}
              className={`min-h-16 flex-row items-center gap-3 px-4 py-3 active:bg-muted ${
                index > 0 ? 'border-t border-border' : ''
              }`}
            >
              <View className="flex-1 gap-0.5">
                <Text className="font-sans-semibold text-base text-card-foreground">{participant.fullName}</Text>
                <Text className="font-sans text-sm text-muted-foreground">
                  {t(`documentTypes.${participant.documentType}`)} · {maskDocument(participant.documentNumber)}
                </Text>
                <Text className="font-sans text-sm text-muted-foreground">
                  {t('account.age', { years: ageOn(participant.birthDate) })}
                </Text>
              </View>
              <CaretRight size={18} color={palette['muted-foreground']} />
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="rounded-xl border border-dashed border-border px-4 py-8">
          <Text className="text-center font-sans text-base text-muted-foreground">{t('account.participantsEmpty')}</Text>
        </View>
      )}
    </FormScreen>
  );
}
