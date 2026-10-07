import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Pantalla de formulario de la cuenta: desplazable, con el teclado bajo control y una ayuda arriba. */
export function FormScreen({ hint, children }: { hint?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        <View className="gap-6 px-5 pt-2">
          {hint ? <Text className="font-sans text-[15px] leading-[22px] text-muted-foreground">{hint}</Text> : null}
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Mensaje breve de confirmación ("Cambios guardados.") que se anuncia al lector de pantalla. */
export function SavedNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text accessibilityLiveRegion="polite" className="text-center font-sans-semibold text-[15px] text-success">
      {message}
    </Text>
  );
}
