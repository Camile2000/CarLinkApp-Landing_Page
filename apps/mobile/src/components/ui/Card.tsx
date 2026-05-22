import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { bg, border, radius, shadow, spacing } from '../../constants/theme';

interface CardProps {
  onPress?: () => void;
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  elevated?: boolean;
  bordered?: boolean;
  testID?: string;
}

export function Card({
  onPress,
  style,
  padding = 4,
  elevated = true,
  bordered = true,
  children,
  testID,
}: PropsWithChildren<CardProps>) {
  const base: ViewStyle = {
    backgroundColor: bg.surface,
    borderRadius: radius.lg,
    padding: spacing[padding],
    ...(bordered ? { borderWidth: 1, borderColor: border.subtle } : null),
    ...(elevated ? shadow.sm : null),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          base,
          pressed && { borderColor: border.default },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[base, style]}>
      {children}
    </View>
  );
}

export const cardStyles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: border.subtle,
    marginVertical: spacing[3],
  },
});
