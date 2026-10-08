import {
  HOST_ONBOARDING_STEPS,
  SUPPORT_EMAIL,
  type AuthUser,
  type Locale,
  type MyHostResponse,
  type RequirementStatus,
} from '@juandavidfuentes/indomitox-shared';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import {
  ArrowSquareOut,
  Bank,
  CalendarBlank,
  CalendarX,
  CaretLeft,
  CaretRight,
  Compass,
  Certificate,
  CheckCircle,
  CircleIcon as Circle,
  FileText,
  IdentificationCard,
  ShieldCheck,
  Storefront,
  type IconProps,
} from 'phosphor-react-native';
import { useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { LogoMark, Tape } from '@/components/brand';
import { FocusAwareStatusBar } from '@/components/focus-aware-status-bar';
import { HostStatusChip } from '@/components/host/status-chip';
import { PressableScale } from '@/components/pressable-scale';
import { TopoPattern } from '@/components/topo-pattern';
import { Button } from '@/components/ui/button';
import { api, mediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useErrorText } from '@/lib/forms';
import { HOST_KEY, openOnWeb, useMyHost } from '@/lib/host';
import { formatInstant, useHostListings } from '@/lib/listings';
import { usePalette } from '@/lib/theme';

const CUT = 22;

const NEEDS: {
  key: 'id' | 'chamber' | 'rnt' | 'nts' | 'insurance' | 'bank';
  icon: ComponentType<IconProps>;
}[] = [
  { key: 'id', icon: IdentificationCard },
  { key: 'chamber', icon: FileText },
  { key: 'rnt', icon: Certificate },
  { key: 'nts', icon: ShieldCheck },
  { key: 'insurance', icon: ShieldCheck },
  { key: 'bank', icon: Bank },
];

function Card({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'warning';
}) {
  return (
    <View
      className={`gap-3 rounded-xl border p-5 ${tone === 'warning' ? 'border-warning/50 bg-warning/10' : 'border-border bg-card'}`}
    >
      {children}
    </View>
  );
}

function ReasonBox({ reason }: { reason: string }) {
  const { t } = useTranslation();
  return (
    <View className="gap-1 rounded-lg border-l-4 border-brand bg-muted px-4 py-3">
      <Text className="font-display text-xs uppercase tracking-[2px] text-muted-foreground">
        {t('host.reasonLabel')}
      </Text>
      <Text className="font-sans text-[15px] leading-[21px] text-foreground">{reason}</Text>
    </View>
  );
}

/** Acceso a una sección del panel móvil (publicaciones o calendario). */
function Tile({ icon: Icon, title, body, href }: { icon: ComponentType<IconProps>; title: string; body: string; href: Href }) {
  const palette = usePalette();
  return (
    <PressableScale
      pressedScale={0.98}
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      className="min-h-20 flex-row items-center gap-4 rounded-xl border border-border bg-card px-4 py-4"
    >
      <View className="size-12 items-center justify-center rounded-xl bg-primary/10">
        <Icon size={26} color={palette.primary} weight="duotone" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-display-italic text-xl uppercase text-card-foreground">{title}</Text>
        <Text className="font-sans text-sm text-muted-foreground">{body}</Text>
      </View>
      <CaretRight size={20} color={palette['muted-foreground']} />
    </PressableScale>
  );
}

/** Publicaciones y calendario del Guía aprobado (MOB-01): conteos y la próxima salida. */
function Operation({ locale }: { locale: Locale }) {
  const { t } = useTranslation();
  const { data } = useHostListings('ALL');
  const items = data?.items ?? [];
  const published = data?.counts.PUBLISHED ?? 0;
  const next = items
    .map((item) => item.nextSlotAt)
    .filter((value): value is string => value !== null)
    .sort()[0];
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-display-italic text-2xl uppercase text-foreground">
        {t('hostApp.operationTitle')}
      </Text>
      <Tile
        icon={Compass}
        title={t('listings.title')}
        body={items.length ? t('hostApp.listingsTile', { published, total: items.length }) : t('hostApp.listingsTileEmpty')}
        href="/panel/publicaciones"
      />
      <Tile
        icon={CalendarBlank}
        title={t('calendar.title')}
        body={
          next
            ? t('hostApp.calendarTile', {
                date: formatInstant(next, locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
              })
            : t('hostApp.calendarTileEmpty')
        }
        href="/panel/calendario"
      />
    </View>
  );
}

/** Lo que el Guía ve en el teléfono: estado, pasos del alta, vencimientos y el acceso a la web. */
function HostSummary({ mine, locale }: { mine: MyHostResponse; locale: Locale }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { host, progress } = mine;
  const expiring = mine.requirements.filter(
    (r: RequirementStatus) =>
      r.state === 'EXPIRED' ||
      ((r.state === 'APPROVED' || r.state === 'PENDING') &&
        r.daysToExpiry !== null &&
        r.daysToExpiry <= 30),
  );
  const requirementLabel = (r: RequirementStatus) =>
    r.sportKey
      ? t('host.ntsFor', { sport: t(`sports.${r.sportKey}`, { defaultValue: r.sportKey }) })
      : t(`hostDocuments.${r.type}.title`);

  return (
    <View className="gap-6">
      <Card>
        <Text
          accessibilityRole="header"
          className="font-display-italic text-[28px] leading-[30px] uppercase text-card-foreground"
        >
          {host.status === 'APPROVED'
            ? t('host.approvedTitle')
            : host.status === 'SUBMITTED' || host.status === 'IN_REVIEW'
              ? t('host.submittedTitle')
              : host.status === 'CHANGES_REQUESTED'
                ? t('host.changesRequestedTitle')
                : host.status === 'REJECTED'
                  ? t('host.rejectedTitle')
                  : host.status === 'SUSPENDED'
                    ? t('host.suspendedTitle')
                    : t('hostApp.stepsTitle')}
        </Text>
        <Text className="font-sans text-[15px] leading-[21px] text-muted-foreground">
          {host.status === 'APPROVED'
            ? t('host.approvedBody')
            : host.status === 'SUBMITTED' || host.status === 'IN_REVIEW'
              ? t('host.submittedBody')
              : t(`hostStatusHint.${host.status}`)}
        </Text>
        {host.statusReason && host.status !== 'APPROVED' ? (
          <ReasonBox reason={host.statusReason} />
        ) : null}
        {host.status === 'REJECTED' || host.status === 'SUSPENDED' ? (
          <Text className="font-sans text-sm text-muted-foreground">
            {t('host.contactSupport', { email: SUPPORT_EMAIL })}
          </Text>
        ) : null}
      </Card>

      {host.status === 'APPROVED' ? <Operation locale={locale} /> : null}

      {host.status === 'APPROVED' ? null : (
        <View className="gap-3">
          <Text
            accessibilityRole="header"
            className="font-display-italic text-2xl uppercase text-foreground"
          >
            {t('host.stepsLabel')}
          </Text>
          <View className="overflow-hidden rounded-xl border border-border bg-card">
            {HOST_ONBOARDING_STEPS.map((step, index) => {
              const complete = progress.steps[step].complete;
              return (
                <View
                  key={step}
                  accessible
                  accessibilityLabel={`${index + 1}. ${t(`hostSteps.${step}.label`)}: ${complete ? t('host.stepComplete') : t('host.stepIncomplete')}`}
                  className={`min-h-14 flex-row items-center gap-3 px-4 py-3 ${index > 0 ? 'border-t border-border' : ''}`}
                >
                  {complete ? (
                    <CheckCircle size={24} color={palette.success} weight="fill" />
                  ) : (
                    <Circle size={24} color={palette['muted-foreground']} />
                  )}
                  <Text className="flex-1 font-sans-semibold text-base text-card-foreground">
                    {index + 1}. {t(`hostSteps.${step}.label`)}
                  </Text>
                  <Text className="font-sans text-sm text-muted-foreground">
                    {complete ? t('host.stepComplete') : t('host.stepIncomplete')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {expiring.length ? (
        <Card tone="warning">
          <View className="flex-row items-center gap-2">
            <CalendarX size={24} color={palette.warning} weight="duotone" />
            <Text
              accessibilityRole="header"
              className="font-display-italic text-xl uppercase text-foreground"
            >
              {t('host.expiringTitle')}
            </Text>
          </View>
          {expiring.map((r) => (
            <View
              key={r.id}
              className="flex-row flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-4 py-3"
            >
              <Text className="font-sans-semibold text-[15px] text-card-foreground">
                {requirementLabel(r)}
              </Text>
              <Text className="font-sans-semibold text-sm text-foreground">
                {r.state === 'EXPIRED'
                  ? t('documentStatus.EXPIRED')
                  : t('host.expiresInDays', {
                      count: r.daysToExpiry ?? 0,
                      days: r.daysToExpiry ?? 0,
                    })}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <View className="gap-3">
        <Button
          label={t('hostApp.continueOnWeb')}
          icon={ArrowSquareOut}
          onPress={() => openOnWeb(locale, '/panel/verificacion')}
        />
        {host.status === 'APPROVED' && host.slug ? (
          <Button
            label={t('hostApp.openPublicPage')}
            variant="outline"
            onPress={() => openOnWeb(locale, '/guias/[slug]', { slug: host.slug! })}
          />
        ) : null}
        <Text className="text-center font-sans text-sm text-muted-foreground">
          {t('hostApp.webHint')}
        </Text>
      </View>
    </View>
  );
}

/** Para quien aún no tiene cuenta de Guía: qué necesita y el botón para empezar (AUTH-04, HOST-01). */
function StartHost({ onStarted }: { onStarted: (mine: MyHostResponse) => void }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const [starting, setStarting] = useState(false);

  const start = async () => {
    setStarting(true);
    try {
      const mine = await api<MyHostResponse>('/v1/host', { method: 'POST', body: {} });
      onStarted(mine);
      Alert.alert(t('host.startTitle'), t('hostApp.started'));
    } catch (error) {
      Alert.alert(t('host.startTitle'), errors.api(error));
    } finally {
      setStarting(false);
    }
  };

  return (
    <View className="gap-6">
      <Text className="font-sans text-base leading-6 text-foreground">{t('host.startBody')}</Text>
      <Card>
        <Text
          accessibilityRole="header"
          className="font-display-italic text-2xl uppercase text-card-foreground"
        >
          {t('host.startNeedTitle')}
        </Text>
        {NEEDS.map(({ key, icon: Icon }) => (
          <View key={key} className="flex-row items-start gap-3">
            <View className="size-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon size={22} color={palette.primary} weight="duotone" />
            </View>
            <Text className="flex-1 pt-2 font-sans text-[15px] leading-[21px] text-card-foreground">
              {t(`host.startNeed.${key}`)}
            </Text>
          </View>
        ))}
        <View className="flex-row items-start gap-2 rounded-lg bg-muted px-4 py-3">
          <Storefront size={20} color={palette.secondary} />
          <Text className="flex-1 font-sans text-sm text-foreground">
            {t('host.productsOnlyNote')}
          </Text>
        </View>
      </Card>
      <View className="gap-3">
        <Button label={t('host.startButton')} onPress={start} loading={starting} />
        <Text className="text-center font-sans text-sm text-muted-foreground">
          {t('hostApp.startHint')}
        </Text>
      </View>
    </View>
  );
}

/**
 * Panel del Guía en la app: estado del alta y acceso a la web (MOB-02) y, aprobado, sus
 * publicaciones y su calendario con las acciones rápidas (MOB-01/03).
 */
export default function HostPanelScreen() {
  const { t, i18n } = useTranslation();
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const errors = useErrorText();
  const { setUser } = useAuth();
  const { data: mine, isPending, isError, error, refetch } = useMyHost();
  const locale = i18n.language as Locale;

  const started = async (created: MyHostResponse) => {
    queryClient.setQueryData(HOST_KEY, created);
    // La sesión también lleva la membresía (Perfil muestra el estado).
    const session = await api<{ user: AuthUser | null }>('/v1/auth/session').catch(() => null);
    if (session?.user) setUser(session.user);
  };

  return (
    <View className="flex-1 bg-background">
      <FocusAwareStatusBar style="light" />
      <ScrollView contentContainerClassName="pb-12">
        <View
          className="overflow-hidden bg-night dark:bg-card"
          style={{ paddingTop: insets.top + 8 }}
        >
          <TopoPattern color={palette.brand} opacity={0.22} variant="screen" />
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/perfil'))}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="size-12 items-center justify-center"
            hitSlop={4}
          >
            <CaretLeft size={26} color={palette['night-foreground']} />
          </Pressable>
          <View className="gap-3 px-5" style={{ paddingBottom: CUT + 24 }}>
            <View className="flex-row items-center gap-4">
              <View className="size-16 items-center justify-center overflow-hidden rounded-full border-2 border-night-foreground/20 bg-night">
                {mine?.host.logoUrl ? (
                  <Image
                    source={{ uri: mediaUrl(mine.host.logoUrl)! }}
                    style={{ width: 64, height: 64 }}
                    contentFit="cover"
                  />
                ) : (
                  <LogoMark size={40} />
                )}
              </View>
              <View className="flex-1 gap-2">
                <Tape label={t('host.panelTitle')} small />
              </View>
            </View>
            <Text
              accessibilityRole="header"
              className="font-display-italic text-[38px] leading-[40px] uppercase text-night-foreground"
              numberOfLines={3}
            >
              {mine
                ? (mine.host.tradeName ?? mine.host.legalName ?? t('host.startTitle'))
                : t('host.startTitle')}
            </Text>
            {mine ? <HostStatusChip status={mine.host.status} /> : null}
          </View>
          <Svg
            width="100%"
            height={CUT}
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}
            pointerEvents="none"
          >
            <Polygon points="0,10.5 100,0 100,10.5" fill={palette.background} />
          </Svg>
        </View>

        <View className="px-5 pt-2">
          {isPending ? (
            <View className="h-40 items-center justify-center">
              <ActivityIndicator color={palette.primary} accessibilityLabel={t('common.loading')} />
            </View>
          ) : isError ? (
            <View className="gap-3">
              <Text className="font-sans text-base text-destructive">{errors.api(error)}</Text>
              <Button label={t('common.retry')} variant="outline" onPress={() => void refetch()} />
            </View>
          ) : mine ? (
            <HostSummary mine={mine} locale={locale} />
          ) : (
            <StartHost onStarted={started} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
