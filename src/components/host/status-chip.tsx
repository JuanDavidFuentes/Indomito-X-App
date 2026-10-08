import type { HostStatus, ListingStatus, ListingVisibility } from '@juandavidfuentes/indomitox-shared';
import {
  Archive,
  Broadcast,
  Eye,
  EyeSlash,
  Hourglass,
  MagnifyingGlass,
  PauseCircle,
  PaperPlaneTilt,
  PencilSimple,
  Prohibit,
  SealCheck,
  Warning,
  XCircle,
  type IconProps,
} from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import type { ColorRole } from '@juandavidfuentes/indomitox-shared/tokens';
import { usePalette } from '@/lib/theme';

type Tone = { container: string; text: string; color: ColorRole };

const TONES = {
  neutral: { container: 'bg-muted border border-border', text: 'text-foreground', color: 'foreground' },
  info: { container: 'bg-secondary', text: 'text-secondary-foreground', color: 'secondary-foreground' },
  success: { container: 'bg-success', text: 'text-success-foreground', color: 'success-foreground' },
  warning: { container: 'bg-warning', text: 'text-warning-foreground', color: 'warning-foreground' },
  danger: { container: 'bg-destructive', text: 'text-destructive-foreground', color: 'destructive-foreground' },
} satisfies Record<string, Tone>;

const STATUS: Record<HostStatus, { icon: ComponentType<IconProps>; tone: keyof typeof TONES }> = {
  DRAFT: { icon: PencilSimple, tone: 'neutral' },
  SUBMITTED: { icon: PaperPlaneTilt, tone: 'info' },
  IN_REVIEW: { icon: MagnifyingGlass, tone: 'info' },
  APPROVED: { icon: SealCheck, tone: 'success' },
  CHANGES_REQUESTED: { icon: Warning, tone: 'warning' },
  REJECTED: { icon: XCircle, tone: 'danger' },
  SUSPENDED: { icon: Prohibit, tone: 'danger' },
};

/** Estado de verificación del Guía con ícono y texto (nunca solo color), sólido en ambos temas. */
export function HostStatusChip({ status }: { status: HostStatus }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { icon: Icon, tone } = STATUS[status];
  const style = TONES[tone];
  return (
    <View className={`flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5 ${style.container}`}>
      <Icon size={15} color={palette[style.color]} weight="bold" />
      <Text className={`font-sans-semibold text-[13px] ${style.text}`}>{t(`hostStatus.${status}`)}</Text>
    </View>
  );
}

const LISTING_STATUS: Record<ListingStatus, { icon: ComponentType<IconProps>; tone: keyof typeof TONES }> = {
  DRAFT: { icon: PencilSimple, tone: 'neutral' },
  IN_MODERATION: { icon: Hourglass, tone: 'info' },
  PUBLISHED: { icon: Broadcast, tone: 'success' },
  PAUSED: { icon: PauseCircle, tone: 'warning' },
  ARCHIVED: { icon: Archive, tone: 'neutral' },
};

/** Estado de una publicación (los mismos tonos que en la web). */
export function ListingStatusChip({ status }: { status: ListingStatus }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { icon: Icon, tone } = LISTING_STATUS[status];
  const style = TONES[tone];
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${style.container}`}>
      <Icon size={13} color={palette[style.color]} weight="bold" />
      <Text className={`font-sans-semibold text-xs ${style.text}`}>{t(`listingStatus.${status}`)}</Text>
    </View>
  );
}

const VISIBILITY: Record<ListingVisibility, { icon: ComponentType<IconProps>; color: ColorRole; text: string }> = {
  PUBLIC: { icon: Eye, color: 'success', text: 'text-success' },
  NOT_PUBLISHED: { icon: EyeSlash, color: 'muted-foreground', text: 'text-muted-foreground' },
  HIDDEN_BY_ADMIN: { icon: Prohibit, color: 'destructive', text: 'text-destructive' },
  BLOCKED: { icon: Prohibit, color: 'warning', text: 'text-warning' },
};

/** Si los Exploradores ven la publicación o no, y por qué. */
export function ListingVisibilityNote({ visibility }: { visibility: ListingVisibility }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const { icon: Icon, color, text } = VISIBILITY[visibility];
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={16} color={palette[color]} weight="bold" />
      <Text className={`flex-shrink font-sans-semibold text-[13px] ${text}`}>{t(`listingVisibility.${visibility}`)}</Text>
    </View>
  );
}
