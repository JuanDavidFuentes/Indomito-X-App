import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Destinations } from '@/components/explore/destinations';
import { ElementCarousel } from '@/components/explore/element-carousel';
import { ExploreHero } from '@/components/explore/explore-hero';
import { FeaturedCarousel } from '@/components/explore/featured-carousel';
import { Levels } from '@/components/explore/levels';
import { SectionTitle } from '@/components/explore/section-title';
import { SportBand } from '@/components/explore/sport-band';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { useColorTheme } from '@/lib/theme';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scheme = useColorTheme();
  const heroHeight = useRef(0);
  const pastHeroRef = useRef(false);
  const [pastHero, setPastHero] = useState(false);

  // Al pasar el hero "Noche", la barra de estado recibe un fondo y cambia sus íconos al tema.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const past = event.nativeEvent.contentOffset.y > heroHeight.current - insets.top - 24;
    if (past !== pastHeroRef.current) {
      pastHeroRef.current = past;
      setPastHero(past);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar style={pastHero && scheme === 'light' ? 'dark' : 'light'} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-12"
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        <View onLayout={(event) => (heroHeight.current = event.nativeEvent.layout.height)}>
          <ExploreHero />
        </View>
        <SportBand />

        <View className="mt-6 gap-5">
          <SectionTitle title={t('home.elementsTitle')} subtitle={t('home.elementsSubtitle')} />
          <ElementCarousel />
        </View>

        <View className="mt-12 gap-5">
          <SectionTitle title={t('home.featuredTitle')} subtitle={t('home.featuredSubtitle')} />
          <FeaturedCarousel />
        </View>

        <View className="mt-12 gap-5">
          <SectionTitle title={t('home.destinationsTitle')} subtitle={t('home.destinationsSubtitle')} />
          <Destinations />
        </View>

        <View className="mt-12 gap-5">
          <SectionTitle title={t('home.levelsTitle')} subtitle={t('home.levelsSubtitle')} />
          <Levels />
        </View>
      </ScrollView>
      {pastHero ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top }}
          pointerEvents="none"
        >
          <View className="flex-1 border-b border-border bg-background" />
        </Animated.View>
      ) : null}
    </View>
  );
}
