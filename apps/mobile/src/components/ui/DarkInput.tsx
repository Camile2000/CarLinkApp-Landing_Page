import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface DarkInputProps {
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
  style?: ViewStyle;
}

export function DarkInput({
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
  style,
}: DarkInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry);
  const hasError = !!error;
  const ToggleIcon = hidden ? Eye : EyeOff;

  return (
    <View style={[s.container, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View
        style={[
          s.field,
          focused && s.fieldFocused,
          hasError && s.fieldError,
          !editable && s.fieldDisabled,
        ]}
      >
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.32)"
          secureTextEntry={secureTextEntry && hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <ToggleIcon
              size={18}
              color="rgba(255,255,255,0.5)"
              strokeWidth={1.75}
            />
          </Pressable>
        ) : null}
      </View>
      {hasError ? (
        <Text style={s.error}>{error}</Text>
      ) : helper ? (
        <Text style={s.helper}>{helper}</Text>
      ) : null}
    </View>
  );
}

interface SpecChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function SpecChip({ label, selected, onPress }: SpecChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        selected && s.chipOn,
        pressed && s.chipPressed,
      ]}
    >
      <Text style={[s.chipTxt, selected && s.chipTxtOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  fieldFocused: {
    borderColor: 'rgba(200,16,46,0.6)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  fieldError: {
    borderColor: '#C8102E',
    backgroundColor: 'rgba(200,16,46,0.06)',
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    paddingVertical: 10,
    fontWeight: '500',
  },
  error: {
    marginTop: 6,
    fontSize: 11,
    color: '#FF6B7A',
    fontWeight: '500',
  },
  helper: {
    marginTop: 6,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '400',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  chipOn: {
    backgroundColor: '#C8102E',
    borderColor: '#C8102E',
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: -0.1,
  },
  chipTxtOn: {
    color: '#fff',
  },
});
