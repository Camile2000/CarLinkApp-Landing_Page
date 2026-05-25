import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bg } from '../../constants/theme';

type Edge = 'top' | 'bottom' | 'left' | 'right';

interface ScreenProps {
  scroll?: boolean;
  tone?: 'paper' | 'navy';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: Edge[];
}

export function Screen({
  scroll = false,
  tone = 'paper',
  style,
  contentStyle,
  edges = ['top', 'bottom'],
  children,
}: PropsWithChildren<ScreenProps>) {
  const insets = useSafeAreaInsets();
  const bg_color = tone === 'navy' ? bg.inverted : bg.page;

  const safeStyle: ViewStyle = {
    paddingTop:    edges.includes('top')    ? insets.top    : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft:   edges.includes('left')   ? insets.left   : 0,
    paddingRight:  edges.includes('right')  ? insets.right  : 0,
  };

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
    <View style={[styles.fill, { backgroundColor: bg_color }, safeStyle, style]}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
});
