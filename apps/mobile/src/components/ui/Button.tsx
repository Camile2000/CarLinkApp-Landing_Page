import React from 'react';
import {
  TouchableOpacity,
  Text,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, radius } from '../../constants/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle => {
    const sizeStyles: Record<Size, ViewStyle> = {
      sm: {
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[4],
        minHeight: 36,
      },
      md: {
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[5],
        minHeight: 44,
      },
      lg: {
        paddingVertical: spacing[4],
        paddingHorizontal: spacing[6],
        minHeight: 52,
      },
    };

    const variantStyles: Record<Variant, ViewStyle> = {
      primary: {
        backgroundColor: isDisabled ? colors.disabled : colors.red,
        borderRadius: radius.md,
        justifyContent: 'center',
        alignItems: 'center',
      },
      secondary: {
        backgroundColor: colors.white,
        borderRadius: radius.md,
        borderWidth: 2,
        borderColor: isDisabled ? colors.border : colors.red,
        justifyContent: 'center',
        alignItems: 'center',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderRadius: radius.md,
        justifyContent: 'center',
        alignItems: 'center',
      },
      link: {
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: isDisabled ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const variantTextStyles: Record<Variant, TextStyle> = {
      primary: {
        color: colors.white,
        fontWeight: '600',
      },
      secondary: {
        color: isDisabled ? colors.muted : colors.red,
        fontWeight: '600',
      },
      ghost: {
        color: colors.slate,
        fontWeight: '600',
      },
      link: {
        color: colors.red,
        fontWeight: '500',
      },
    };

    const sizeTextStyles: Record<Size, TextStyle> = {
      sm: {
        fontSize: 14,
      },
      md: {
        fontSize: 16,
      },
      lg: {
        fontSize: 18,
      },
    };

    return {
      ...sizeTextStyles[size],
      ...variantTextStyles[variant],
    };
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[getContainerStyle(), style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.red}
          size="small"
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
