import { WISHLIST_LIMITS, type WishlistSummary } from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Heart, Plus } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { useErrorText } from '@/lib/forms';
import { photoUrl } from '@/lib/listings';
import { usePalette } from '@/lib/theme';
import { useWishlistActions, useWishlists } from '@/lib/wishlists';

function Cover({ list }: { list: WishlistSummary }) {
  const palette = usePalette();
  const uri = photoUrl(list.covers[0], 320);
  return (
    <View className="size-14 items-center justify-center overflow-hidden rounded-xl bg-muted">
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessible={false} /> : <Heart size={22} color={palette['muted-foreground']} />}
    </View>
  );
}

/** "Guardar en una lista" (EXP-01): un toque guarda en una lista existente; o se crea una nueva. */
export default function SaveToListScreen() {
  const { listingId, title } = useLocalSearchParams<{ listingId: string; title: string }>();
  const { t } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const errors = useErrorText();
  const { data, isPending } = useWishlists();
  const { create, add } = useWishlistActions();
  const [name, setName] = useState('');
  const lists = data?.lists ?? [];
  const busy = create.isPending || add.isPending;
  const onError = (error: unknown) => Alert.alert(t('favorites.saveTo'), errors.api(error));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <Text className="font-sans text-base text-muted-foreground">{t('favorites.saveToBody', { title })}</Text>
        {isPending ? (
          <ActivityIndicator color={palette.primary} />
        ) : (
          <View className="gap-1" accessibilityRole="list">
            {lists.map((list) => (
              <Pressable
                key={list.id}
                accessibilityRole="button"
                disabled={busy}
                onPress={() => add.mutate({ listId: list.id, listingId }, { onSuccess: () => router.back(), onError })}
                className="flex-row items-center gap-3 rounded-xl p-2 active:bg-muted"
              >
                <Cover list={list} />
                <View className="flex-1">
                  <Text className="font-sans-semibold text-base text-foreground" numberOfLines={1}>
                    {list.name}
                  </Text>
                  <Text className="font-sans text-sm text-muted-foreground">{t('favorites.listCount', { count: list.itemCount })}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
        <View className="gap-2 border-t border-border pt-5">
          <Text className="font-sans-semibold text-base text-foreground">{lists.length ? t('favorites.newList') : t('favorites.listName')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={WISHLIST_LIMITS.nameMax}
            placeholder={lists.length ? t('favorites.listNamePlaceholder') : t('favorites.defaultListName')}
            placeholderTextColor={palette['muted-foreground']}
            accessibilityLabel={t('favorites.listName')}
            className="h-12 rounded-md border border-input bg-card px-3 font-sans text-base text-foreground"
          />
          <Button
            label={t('favorites.createAndSave')}
            icon={Plus}
            loading={create.isPending}
            disabled={busy}
            onPress={() =>
              create.mutate({ name: name.trim() || t('favorites.defaultListName'), listingId }, { onSuccess: () => router.back(), onError })
            }
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
