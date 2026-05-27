import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import {
  bg,
  border,
  fg,
  palette,
  radius,
  spacing,
  typography,
} from '../../constants/theme';

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  style?: ViewStyle;
  hasError?: boolean;
}

export function OtpInput({
  value,
  onChangeText,
  length = 6,
  style,
  hasError = false,
}: OtpInputProps) {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;

    const next = value.split('');
    next[index] = text;
    const otp = next.join('').slice(0, length);
    onChangeText(otp);

    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length }).map((_, index) => {
        const isFocused = focusedIndex === index;
        const isFilled = !!value[index];
        return (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            style={[
              styles.cell,
              isFilled && styles.cellFilled,
              isFocused && styles.cellFocused,
              hasError && styles.cellError,
            ]}
            value={value[index] || ''}
            onChangeText={(t) => handleChange(t, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            selectionColor={border.accent}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 56,
    borderWidth: 1,
    borderColor: border.subtle,
    borderRadius: radius.md,
    fontSize: 24,
    fontWeight: typography.weight.bold,
    color: fg.strong,
    backgroundColor: palette.neutral[100],
  },
  cellFilled: {
    backgroundColor: bg.surface,
    borderColor: border.default,
  },
  cellFocused: {
    backgroundColor: bg.surface,
    borderColor: border.strong,
    borderWidth: 2,
  },
  cellError: {
    borderColor: border.accent,
  },
});
