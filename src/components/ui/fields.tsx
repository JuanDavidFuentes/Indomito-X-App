import { Check, Eye, EyeSlash, WarningCircle } from 'phosphor-react-native';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useErrorText } from '@/lib/forms';
import { usePalette } from '@/lib/theme';

interface BaseProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  hint?: string;
}

type InputProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur' | 'className'>;

/** Error de un campo: se anuncia al lector de pantalla cuando aparece. */
function FieldErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text accessibilityLiveRegion="polite" role="alert" className="font-sans-medium text-sm text-destructive">
      {message}
    </Text>
  );
}

function inputClass(invalid: boolean) {
  return `h-12 rounded-md border bg-card px-4 font-sans text-base text-foreground ${
    invalid ? 'border-destructive' : 'border-input'
  }`;
}

/** Campo de texto con etiqueta visible, ayuda y error debajo (MASTER §12, formularios). */
export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  transform,
  ...input
}: BaseProps<T> & InputProps & { /** Ajusta el texto mientras se escribe (p. ej. una máscara de fecha). */ transform?: (text: string) => string }) {
  const palette = usePalette();
  const errors = useErrorText();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View className="gap-1.5">
          <Text className="font-sans-semibold text-sm text-foreground">{label}</Text>
          <TextInput
            {...input}
            ref={field.ref}
            value={(field.value as string | null | undefined) ?? ''}
            onChangeText={(text) => field.onChange(transform ? transform(text) : text)}
            onBlur={field.onBlur}
            accessibilityLabel={label}
            accessibilityHint={hint}
            placeholderTextColor={palette['muted-foreground']}
            className={inputClass(fieldState.invalid)}
          />
          {hint ? <Text className="font-sans text-sm text-muted-foreground">{hint}</Text> : null}
          <FieldErrorText message={errors.field(fieldState.error?.message)} />
        </View>
      )}
    />
  );
}

/** Contraseña con botón para mostrarla; admite pegar y los gestores de contraseñas. */
export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  hint,
  newPassword = false,
  onSubmitEditing,
}: BaseProps<T> & { newPassword?: boolean; onSubmitEditing?: () => void }) {
  const { t } = useTranslation();
  const palette = usePalette();
  const errors = useErrorText();
  const [visible, setVisible] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View className="gap-1.5">
          <Text className="font-sans-semibold text-sm text-foreground">{label}</Text>
          <View className="justify-center">
            <TextInput
              ref={field.ref}
              value={(field.value as string | undefined) ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              secureTextEntry={!visible}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={newPassword ? 'new-password' : 'current-password'}
              textContentType={newPassword ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={onSubmitEditing}
              accessibilityLabel={label}
              accessibilityHint={hint}
              className={`${inputClass(fieldState.invalid)} pr-14`}
            />
            <Pressable
              onPress={() => setVisible((value) => !value)}
              accessibilityRole="button"
              accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
              accessibilityState={{ checked: visible }}
              hitSlop={4}
              className="absolute right-0 h-12 w-12 items-center justify-center"
            >
              {visible ? (
                <EyeSlash size={22} color={palette['muted-foreground']} />
              ) : (
                <Eye size={22} color={palette['muted-foreground']} />
              )}
            </Pressable>
          </View>
          {hint ? <Text className="font-sans text-sm text-muted-foreground">{hint}</Text> : null}
          <FieldErrorText message={errors.field(fieldState.error?.message)} />
        </View>
      )}
    />
  );
}

/** Casilla con texto (p. ej. un consentimiento) y un enlace opcional al lado. */
export function CheckboxField<T extends FieldValues>({
  control,
  name,
  label,
  link,
}: Omit<BaseProps<T>, 'hint'> & { link?: ReactNode }) {
  const palette = usePalette();
  const errors = useErrorText();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const checked = field.value === true;
        return (
          <View className="gap-1">
            <View className="flex-row items-start gap-3">
              <Pressable
                onPress={() => field.onChange(!checked)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={label}
                hitSlop={12}
                className={`mt-0.5 size-6 items-center justify-center rounded-md border-2 ${
                  checked ? 'border-primary bg-primary' : fieldState.invalid ? 'border-destructive' : 'border-input'
                }`}
              >
                {checked ? <Check size={16} color={palette['primary-foreground']} weight="bold" /> : null}
              </Pressable>
              <Text className="flex-1 font-sans text-[15px] leading-[21px] text-foreground" onPress={() => field.onChange(!checked)}>
                {label} {link}
              </Text>
            </View>
            <View className="pl-9">
              <FieldErrorText message={errors.field(fieldState.error?.message)} />
            </View>
          </View>
        );
      }}
    />
  );
}

/** Error general del formulario (credenciales inválidas, sin red…). */
export function FormAlert({ message }: { message: string }) {
  const palette = usePalette();
  return (
    <View
      role="alert"
      accessibilityLiveRegion="assertive"
      className="flex-row items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/10 px-3.5 py-3"
    >
      <WarningCircle size={20} color={palette.destructive} weight="fill" />
      <Text className="flex-1 font-sans-medium text-sm text-destructive">{message}</Text>
    </View>
  );
}

/** Opción seleccionable tipo píldora (idiomas, deportes, tipo de documento, nivel). */
export function Chip({
  label,
  selected,
  onPress,
  role = 'checkbox',
  leading,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role?: 'checkbox' | 'radio';
  leading?: ReactNode;
}) {
  const palette = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      className={`min-h-11 flex-row items-center gap-1.5 rounded-full border-2 px-4 active:opacity-80 ${
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
      }`}
    >
      {selected && !leading ? <Check size={15} color={palette.primary} weight="bold" /> : leading}
      <Text className={`font-sans-semibold text-[15px] ${selected ? 'text-primary' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}
