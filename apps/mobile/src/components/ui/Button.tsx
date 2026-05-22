import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import {
  accent,
  bg,
  brand,
  border,
  fg,
  palette,
  radius,
  shadow,
  spacing,
  typography,
} from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'inverted' | 'outlined' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const HEIGHT: Record<Size, number> = { sm: 36, md: 44, lg: 52 };
const PADDING_X: Record<Size, number> = { sm: spacing[3], md: spacing[5], lg: spacing[6] };
const FONT_SIZE: Record<Size, number> = { sm: 13, md: 15, lg: 16 };

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  style,
  textStyle,
  testID,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const surface = surfaceStyle(variant, isDisabled);
  const labelColor = textColor(variant, isDisabled);
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: PADDING_X[size],
          opacity: isDisabled ? 0.45 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        surface,
        fullWidth && styles.fullWidth,
        variant === 'primary' && !isDisabled && shadow.xs,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <View style={styles.content}>
          {LeadingIcon ? (
            <LeadingIcon size={iconSize} color={labelColor} strokeWidth={2} />
          ) : null}
          <Text
            style={[
              styles.label,
              { color: labelColor, fontSize: FONT_SIZE[size] },
              variant === 'link' && styles.linkLabel,
              textStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {TrailingIcon ? (
            <TrailingIcon size={iconSize} color={labelColor} strokeWidth={2} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

function surfaceStyle(variant: Variant, disabled: boolean): ViewStyle {
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: disabled ? palette.neutral[300] : accent.base,
        borderRadius: radius.md,
      };
    case 'secondary':
      return {
        backgroundColor: bg.surface,
        borderWidth: 1,
        borderColor: border.strong,
        borderRadius: radius.md,
      };
    case 'inverted':
      return {
        backgroundColor: brand.navy,
        borderRadius: radius.md,
      };
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: accent.base,
        borderRadius: radius.md,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        borderRadius: radius.md,
      };
    case 'link':
      return {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
      };
  }
}

function textColor(variant: Variant, disabled: boolean): string {
  if (disabled) return fg.muted;
  switch (variant) {
    case 'primary':
    case 'inverted':
      return fg.onPrimary;
    case 'secondary':
      return fg.default;
    case 'outlined':
    case 'link':
      return accent.base;
    case 'ghost':
      return fg.default;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  label: {
    fontWeight: typography.weight.semibold as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  linkLabel: {
    textDecorationLine: 'underline',
  },
});
