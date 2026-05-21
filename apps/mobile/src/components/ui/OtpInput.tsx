import React, { useRef, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius } from '../../constants/colors';

interface OtpInputProps {
  value: string;
  onChangeText: (text: string) => void;
  length?: number;
  style?: ViewStyle;
}

export function OtpInput({
  value,
  onChangeText,
  length = 6,
  style,
}: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return;

    const newValue = value.split('');
    newValue[index] = text;
    const otpValue = newValue.join('').slice(0, length);
    onChangeText(otpValue);

    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const cells = Array.from({ length }).map((_, index) => (
    <TextInput
      key={index}
      ref={(ref) => {
        inputRefs.current[index] = ref;
      }}
      style={[
        styles.cell,
        focusedIndex === index && styles.cellFocused,
      ]}
      value={value[index] || ''}
      onChangeText={(text) => handleChange(text, index)}
      onKeyPress={(e) => handleKeyPress(e, index)}
      onFocus={() => setFocusedIndex(index)}
      onBlur={() => setFocusedIndex(null)}
      keyboardType="numeric"
      maxLength={1}
      textAlign="center"
      selectionColor={colors.red}
    />
  ));

  return (
    <View style={[styles.container, style]}>
      {cells}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing[4],
  },
  cell: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: 24,
    fontWeight: '600',
    color: colors.slate,
    backgroundColor: colors.white,
  },
  cellFocused: {
    borderColor: colors.red,
  },
});
