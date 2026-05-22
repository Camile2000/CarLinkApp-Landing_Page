import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bg } from '../../constants/theme';

interface ScreenProps {
  scroll?: boolean;
  tone?: 'paper' | 'navy';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  scroll = false,
  tone = 'paper',
  style,
  contentStyle,
  edges = ['top', 'bottom'],
  children,
}: PropsWithChildren<ScreenProps>) {
  const bg_color = tone === 'navy' ? bg.inverted : bg.page;

  const inner = scroll ? (
    <ScrollView
      style={StyleSheet.flatten([styles.fill, { backgroundColor: bg_color }])}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, { backgroundColor: bg_color }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: bg_color }, style]}>
      <SafeAreaView edges={edges} style={styles.fill}>
        {inner}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
