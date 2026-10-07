import {
  DIFFICULTIES,
  SPORT_ELEMENTS,
  type Difficulty,
  type FavoriteSport,
  type MeResponse,
  type SportDto,
  type SportElement,
} from '@juandavidfuentes/indomitox-shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { FormScreen, SavedNote } from '@/components/account/form-screen';
import { DifficultyShape } from '@/components/difficulty';
import { Button } from '@/components/ui/button';
import { Chip, FormAlert } from '@/components/ui/fields';
import { useMe, useSports, useStoreMe } from '@/lib/account';
import { api } from '@/lib/api';
import { useErrorText } from '@/lib/forms';

/** Punto de color de cada elemento (los tintes de foto de MASTER §2). */
const DOT: Record<SportElement, string> = {
  WATER: 'bg-tint-water',
  AIR: 'bg-tint-air',
  LAND: 'bg-tint-land',
  UNDERGROUND: 'bg-tint-underground dark:bg-muted-foreground',
  PARK: 'bg-tint-park',
};

const sameSelection = (a: FavoriteSport[], b: FavoriteSport[]) =>
  a.length === b.length && a.every((x) => b.some((y) => y.sportKey === x.sportKey && y.level === x.level));

export default function FavoriteSportsScreen() {
  const { data: me } = useMe();
  const { data: sports } = useSports();
  if (!me || !sports) return <ActivityIndicator className="mt-10" />;
  return <SportsForm me={me} sports={sports} />;
}

/**
 * EXP-02: deportes favoritos con su nivel (también filtran las alertas de cercanía, PROX-05).
 * El nivel usa la escala de dificultad, con forma y texto (SAFE-01).
 */
function SportsForm({ me, sports }: { me: MeResponse; sports: SportDto[] }) {
  const { t, i18n } = useTranslation();
  const errors = useErrorText();
  const storeMe = useStoreMe();
  const [selection, setSelection] = useState<FavoriteSport[]>(me.profile.favoriteSports);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const dirty = !sameSelection(selection, me.profile.favoriteSports);

  const sportName = (key: string) => (i18n.exists(`sports.${key}`) ? t(`sports.${key}`) : key);
  const toggle = (key: string) => {
    setSaved(null);
    setSelection((current) =>
      current.some((s) => s.sportKey === key)
        ? current.filter((s) => s.sportKey !== key)
        : [...current, { sportKey: key, level: 'BEGINNER' }],
    );
  };
  const setLevel = (key: string, level: Difficulty) => {
    setSaved(null);
    setSelection((current) => current.map((s) => (s.sportKey === key ? { ...s, level } : s)));
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const response = await api<MeResponse>('/v1/me/sports', { method: 'PUT', body: { sports: selection } });
      storeMe(response);
      setSelection(response.profile.favoriteSports);
      setSaved(t('account.saved'));
    } catch (error) {
      setFormError(errors.api(error));
    } finally {
      setSaving(false);
    }
  };

  const chosen = sports.filter((sport) => selection.some((s) => s.sportKey === sport.key));

  return (
    <FormScreen hint={t('account.sportsHint')}>
      {SPORT_ELEMENTS.map((element) => {
        const group = sports.filter((sport) => sport.element === element);
        if (group.length === 0) return null;
        return (
          <View key={element} className="gap-3">
            <View className="flex-row items-center gap-2">
              <View className={`size-2.5 rounded-full ${DOT[element]}`} />
              <Text accessibilityRole="header" className="font-sans-bold text-sm tracking-[1.2px] uppercase text-foreground">
                {t(`elements.${element}`)}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {group.map((sport) => (
                <Chip
                  key={sport.key}
                  label={sportName(sport.key)}
                  selected={selection.some((s) => s.sportKey === sport.key)}
                  onPress={() => toggle(sport.key)}
                />
              ))}
            </View>
          </View>
        );
      })}

      <View className="gap-4 border-t border-border pt-6">
        <Text accessibilityLiveRegion="polite" className="font-sans-semibold text-base text-foreground">
          {t('account.sportsCount', { count: selection.length })}
        </Text>
        {chosen.map((sport) => {
          const level = selection.find((s) => s.sportKey === sport.key)!.level;
          return (
            <View key={sport.key} className="gap-2 rounded-xl bg-muted/60 p-3">
              <Text className="font-sans-semibold text-base text-foreground">
                {sportName(sport.key)} · <Text className="font-sans text-muted-foreground">{t('account.level')}</Text>
              </Text>
              <View className="flex-row flex-wrap gap-2" accessibilityRole="radiogroup" accessibilityLabel={sportName(sport.key)}>
                {DIFFICULTIES.map((difficulty) => (
                  <Chip
                    key={difficulty}
                    role="radio"
                    label={t(`difficulty.${difficulty}`)}
                    selected={level === difficulty}
                    onPress={() => setLevel(sport.key, difficulty)}
                    leading={<DifficultyShape level={difficulty} size={11} />}
                  />
                ))}
              </View>
            </View>
          );
        })}
        {formError ? <FormAlert message={formError} /> : null}
        <Button label={t('common.save')} onPress={save} loading={saving} disabled={!dirty} />
        <SavedNote message={saved} />
      </View>
    </FormScreen>
  );
}
