import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius } from '../../constants/colors';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  editable?: boolean;
  icon?: LucideIcon;
  onIconPress?: () => void;
  style?: ViewStyle;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  icon: Icon,
  onIconPress,
  style,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!secureTextEntry);

  const isFloating = focused || value.length > 0;
  const hasError = !!error;

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          hasError && styles.inputWrapperError,
        ]}
      >
        <Text
          style={[
            styles.label,
            isFloating && styles.labelFloating,
            hasError && styles.labelError,
          ]}
        >
          {label}
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, !editable && styles.inputDisabled]}
            value={value}
            onChangeText={onChangeText}
            placeholder={isFloating ? '' : placeholder}
            placeholderTextColor={colors.muted}
            secureTextEntry={secureTextEntry && showPassword}
            keyboardType={keyboardType}
            editable={editable}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />

          {secureTextEntry && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.iconButton}
            >
              {Icon && (
                <Icon
                  size={20}
                  color={colors.slate}
                  strokeWidth={1.75}
                />
              )}
            </TouchableOpacity>
          )}

          {Icon && !secureTextEntry && onIconPress && (
            <TouchableOpacity onPress={onIconPress} style={styles.iconButton}>
              <Icon
                size={20}
                color={colors.slate}
                strokeWidth={1.75}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.white,
  },
  inputWrapperFocused: {
    borderColor: colors.red,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  label: {
    fontSize: 16,
    color: colors.slate,
    marginBottom: spacing[1],
    fontWeight: '500',
  },
  labelFloating: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing[2],
  },
  labelError: {
    color: colors.error,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.slate,
    paddingVertical: spacing[2],
  },
  inputDisabled: {
    opacity: 0.5,
  },
  iconButton: {
    padding: spacing[2],
    marginLeft: spacing[1],
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing[1],
    fontWeight: '500',
  },
});
