import type { WishlistSummary } from '@juandavidfuentes/indomitox-shared';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { TopoPattern } from '@/components/topo-pattern';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { photoUrl, usePullToRefresh } from '@/lib/listings';
import { useColorTheme, usePalette } from '@/lib/theme';
import { useWishlists } from '@/lib/wishlists';

function Mosaic({ list, size }: { list: WishlistSummary; size: number }) {
  const palette = usePalette();
  const [first, ...rest] = list.covers;
  const uri = (index: number) => photoUrl(list.covers[index], index === 0 ? 640 : 320);
  return (
    <View className="flex-row gap-1 overflow-hidden rounded-2xl bg-muted" style={{ height: size * 0.75 }}>
      {first ? (
        <>
          <Image source={{ uri: uri(0) ?? undefined }} style={{ flex: rest.length ? 2 : 1 }} contentFit="cover" accessible={false} />
          {rest.length ? (
            <View className="flex-1 gap-1">
              {rest.slice(0, 2).map((cover, index) => (
                <Image key={cover.id} source={{ uri: uri(index + 1) ?? undefined }} style={{ flex: 1 }} contentFit="cover" accessible={false} />
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Heart size={36} color={palette['muted-foreground']} />
        </View>
      )}
    </View>
  );
}

/** Favoritos (EXP-01): las listas del Explorador. Sin sesión invita a ingresar (AUTH-07). */
export default function FavoritesScreen() {
  const { t } = useTranslation();
  const palette = usePalette();
  const scheme = useColorTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { status } = useAuth();
  const lists = useWishlists();
  const refresh = usePullToRefresh(lists.refetch);
  const tile = (width - 20 * 2 - 14) / 2;

  if (status !== 'signedIn') {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <FocusAwareStatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <TopoPattern color={palette.primary} opacity={0.16} variant="screen" />
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View className="size-24 items-center justify-center rounded-3xl bg-night" style={{ transform: [{ rotate: '-4deg' }] }}>
            <Heart size={46} color={palette.accent} weight="duotone" />
          </View>
          <Text accessibilityRole="header" className="self-stretch text-center font-display-italic text-4xl uppercase text-foreground">
            {t('favorites.signInTitle')}
          </Text>
          <Text className="self-stretch text-center font-sans text-base leading-6 text-muted-foreground">{t('favorites.signInBody')}</Text>
          <Button label={t('favorites.signIn')} onPress={() => router.push('/auth/ingresar')} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <FlatList
        data={lists.data?.lists ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 22 }}
        refreshControl={<RefreshControl {...refresh} tintColor={palette.primary} colors={[palette.primary]} />}
        ListHeaderComponent={
          <View className="gap-1 pb-2">
            <Text accessibilityRole="header" className="font-display-italic text-5xl uppercase text-foreground">
              {t('favorites.title')}
            </Text>
            <Text className="font-sans text-base text-muted-foreground">{t('favorites.subtitle')}</Text>
          </View>
        }
        ListEmptyComponent={
          lists.isPending ? (
            <ActivityIndicator color={palette.primary} />
          ) : (
            <View className="items-center gap-3 rounded-2xl border border-border bg-card p-6">
              <Heart size={40} color={palette.primary} weight="duotone" />
              <Text className="self-stretch text-center font-display-italic text-2xl uppercase text-foreground">{t('favorites.emptyTitle')}</Text>
              <Text className="self-stretch text-center font-sans text-base text-muted-foreground">{t('favorites.emptyBody')}</Text>
              <Button label={t('favorites.emptyAction')} variant="outline" onPress={() => router.navigate('/mapa')} />
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${t('favorites.listCount', { count: item.itemCount })}`}
            onPress={() => router.push({ pathname: '/favoritos/[id]', params: { id: item.id } })}
            style={{ width: tile }}
            className="gap-2 active:opacity-80"
          >
            <Mosaic list={item} size={tile} />
            <View>
              <Text className="font-display text-xl uppercase text-foreground" numberOfLines={2}>
                {item.name}
              </Text>
              <Text className="font-sans text-sm text-muted-foreground">{t('favorites.listCount', { count: item.itemCount })}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
