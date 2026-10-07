import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { CaretRight, type IconProps } from 'phosphor-react-native';
import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePalette } from '@/lib/theme';

export interface MenuItem {
  href: Href;
  icon: ComponentType<IconProps>;
  label: string;
  detail?: string;
}

/** Lista de accesos a las secciones de la cuenta (filas de 56 dp con ícono y flecha). */
export function AccountMenu({ items }: { items: MenuItem[] }) {
  const palette = usePalette();
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      {items.map(({ href, icon: Icon, label, detail }, index) => (
        <Pressable
          key={label}
          onPress={() => router.push(href)}
          accessibilityRole="button"
          accessibilityHint={detail}
          className={`min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-muted ${
            index > 0 ? 'border-t border-border' : ''
          }`}
        >
          <View className="size-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon size={22} color={palette.primary} weight="duotone" />
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-base text-card-foreground">{label}</Text>
            {detail ? <Text className="font-sans text-sm text-muted-foreground">{detail}</Text> : null}
          </View>
          <CaretRight size={18} color={palette['muted-foreground']} />
        </Pressable>
      ))}
    </View>
  );
}
