import { WISHLIST_LIMITS } from '@juandavidfuentes/indomitox-shared';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { PencilSimple, Trash, X } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { ListingCard } from '@/components/listing-card';
import { Button } from '@/components/ui/button';
import { useErrorText } from '@/lib/forms';
import { usePullToRefresh } from '@/lib/listings';
import { usePalette } from '@/lib/theme';
import { useWishlist, useWishlistActions } from '@/lib/wishlists';

/** Una lista de favoritos: sus aventuras, cambiar el nombre, quitar una o eliminar la lista. */
export default function WishlistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const list = useWishlist(id);
  const refresh = usePullToRefresh(list.refetch);
  const { rename, remove, destroy } = useWishlistActions();
  const [name, setName] = useState<string | null>(null);

  const onError = (error: unknown) => Alert.alert(t('favorites.title'), errors.api(error));
  const confirmDelete = () =>
    Alert.alert(t('favorites.deleteConfirmTitle', { name: list.data?.name ?? '' }), t('favorites.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('favorites.deleteList'), style: 'destructive', onPress: () => destroy.mutate(id, { onSuccess: () => router.back(), onError }) },
    ]);

  if (!list.data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        {list.isPending ? <ActivityIndicator color={palette.primary} /> : <Text className="font-sans text-base text-muted-foreground">{t('errors.WISHLIST_NOT_FOUND')}</Text>}
      </View>
    );
  }
  const data = list.data;

  return (
    <>
      <Stack.Screen options={{ title: data.name }} />
      <FlatList
        data={data.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, gap: 28, paddingBottom: 40 }}
        refreshControl={<RefreshControl {...refresh} tintColor={palette.primary} colors={[palette.primary]} />}
        ListHeaderComponent={
          <View className="gap-3">
            {name !== null ? (
              <View className="gap-2">
                <Text className="font-sans-semibold text-sm text-foreground">{t('favorites.listName')}</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  maxLength={WISHLIST_LIMITS.nameMax}
                  autoFocus
                  accessibilityLabel={t('favorites.listName')}
                  className="h-12 rounded-md border border-input bg-card px-3 font-sans text-base text-foreground"
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button
                      label={t('common.save')}
                      loading={rename.isPending}
                      disabled={!name.trim()}
                      onPress={() => rename.mutate({ id, name: name.trim() }, { onSuccess: () => setName(null), onError })}
                    />
                  </View>
                  <View className="flex-1">
                    <Button label={t('common.cancel')} variant="outline" onPress={() => setName(null)} />
                  </View>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button label={t('favorites.rename')} variant="outline" icon={PencilSimple} onPress={() => setName(data.name)} />
                </View>
                <View className="flex-1">
                  <Button label={t('favorites.deleteList')} variant="ghost" icon={Trash} onPress={confirmDelete} />
                </View>
              </View>
            )}
            <Text className="font-sans text-sm text-muted-foreground">{t('favorites.listCount', { count: data.items.length })}</Text>
            {data.unavailableCount ? <Text className="font-sans text-sm text-muted-foreground">{t('favorites.unavailable', { count: data.unavailableCount })}</Text> : null}
          </View>
        }
        ListEmptyComponent={<Text className="rounded-2xl border border-dashed border-border p-6 text-center font-sans text-base text-muted-foreground">{t('favorites.listEmpty')}</Text>}
        renderItem={({ item }) => (
          <View className="gap-1">
            <ListingCard listing={item} />
            <Pressable
              accessibilityRole="button"
              onPress={() => remove.mutate({ listId: id, listingId: item.id }, { onError })}
              className="min-h-11 flex-row items-center gap-1.5 self-start"
            >
              <X size={16} color={palette.primary} weight="bold" />
              <Text className="font-sans-semibold text-base text-primary">{t('favorites.removeItem')}</Text>
            </Pressable>
          </View>
        )}
      />
    </>
  );
}
