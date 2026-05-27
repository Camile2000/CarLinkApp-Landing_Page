import React, { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bg } from '../../constants/theme';

type Edge = 'top' | 'bottom' | 'left' | 'right';

interface ScreenProps {
  scroll?: boolean;
  tone?: 'paper' | 'navy';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: Edge[];
  keyboardAvoiding?: boolean;
}

export function Screen({
  scroll = false,
  tone = 'paper',
  style,
  contentStyle,
  edges = ['top', 'bottom'],
  keyboardAvoiding = false,
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

  const scrollNode = scroll ? (
    <ScrollView
      style={StyleSheet.flatten([styles.fill, { backgroundColor: bg_color }])}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, { backgroundColor: bg_color }, contentStyle]}>
      {children}
    </View>
  );

  const inner = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {scrollNode}
    </KeyboardAvoidingView>
  ) : (
    scrollNode
  );

  return (
    <View style={[styles.fill, { backgroundColor: bg_color }, safeStyle, style]}>
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 120 },
});
