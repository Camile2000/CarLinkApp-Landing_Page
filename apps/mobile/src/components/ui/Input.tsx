import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Pressable,
} from 'react-native';
import { Eye, EyeOff, LucideIcon } from 'lucide-react-native';
import {
  bg,
  border,
  fg,
  palette,
  radius,
  spacing,
  typography,
} from '../../constants/theme';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  editable?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  onTrailingIconPress?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
  style?: ViewStyle;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helper,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoComplete,
  editable = true,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  onTrailingIconPress,
  onBlur: onBlurProp,
  onFocus: onFocusProp,
  style,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);
  const hasError = !!error;
  const ToggleIcon = hidden ? Eye : EyeOff;

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          hasError && styles.fieldError,
          !editable && styles.fieldDisabled,
        ]}
      >
        {LeadingIcon ? (
          <LeadingIcon
            size={18}
            color={focused ? fg.default : palette.neutral[500]}
            strokeWidth={1.75}
          />
        ) : null}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={fg.subtle}
          secureTextEntry={secureTextEntry && hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          onFocus={() => {
            setFocused(true);
            onFocusProp?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlurProp?.();
          }}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <ToggleIcon size={18} color={palette.neutral[500]} strokeWidth={1.75} />
          </Pressable>
        ) : TrailingIcon ? (
          <Pressable onPress={onTrailingIconPress} hitSlop={8}>
            <TrailingIcon size={18} color={palette.neutral[500]} strokeWidth={1.75} />
          </Pressable>
        ) : null}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
      {hasError ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.semibold,
    color: fg.strong,
    marginBottom: spacing[2],
    letterSpacing: typography.tracking.wide,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    minHeight: 44,
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border.subtle,
    backgroundColor: palette.neutral[100],
  },
  fieldFocused: {
    borderColor: border.strong,
    backgroundColor: bg.surface,
  },
  fieldError: {
    borderColor: border.accent,
    backgroundColor: bg.surface,
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: typography.size.body,
    color: fg.strong,
    paddingVertical: spacing[2],
  },
  error: {
    marginTop: spacing[1],
    fontSize: typography.size.caption,
    color: border.accent,
    fontWeight: typography.weight.medium,
  },
  helper: {
    marginTop: spacing[1],
    fontSize: typography.size.caption,
    color: fg.muted,
  },
});
