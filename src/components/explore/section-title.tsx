import { Text, View } from 'react-native';

/** Título de sección en Barlow Condensed 800 itálica, con subtítulo opcional. */
export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-1.5 px-5">
      <Text accessibilityRole="header" className="font-display-italic text-[34px] leading-[34px] uppercase text-foreground">
        {title}
      </Text>
      {subtitle ? <Text className="font-sans text-base leading-6 text-muted-foreground">{subtitle}</Text> : null}
    </View>
  );
}
