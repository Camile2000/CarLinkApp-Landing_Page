import React, { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { accent, fg, typography } from '../../constants/theme';

type BaseProps = PropsWithChildren<
  TextProps & {
    color?: string;
    align?: TextStyle['textAlign'];
    weight?: TextStyle['fontWeight'];
    style?: TextStyle | TextStyle[];
  }
>;

function applyExtras(
  base: TextStyle,
  { color, align, weight }: Pick<BaseProps, 'color' | 'align' | 'weight'>,
): TextStyle {
  return {
    ...base,
    ...(color ? { color } : null),
    ...(align ? { textAlign: align } : null),
    ...(weight ? { fontWeight: weight } : null),
  };
}

export function Display({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.display, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function H1({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.h1, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function H2({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.h2, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function H3({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.h3, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function H4({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.h4, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.body, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function BodySm({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.bodySm, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function Label({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.label, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function Caption({ children, style, color, align, weight, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.caption, { color, align, weight }), style]}>
      {children}
    </Text>
  );
}

export function Eyebrow({ children, style, color, align, ...rest }: BaseProps) {
  return (
    <Text {...rest} style={[applyExtras(styles.eyebrow, { color, align }), style]}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: typography.size.display,
    fontWeight: typography.weight.black,
    color: fg.strong,
    lineHeight: typography.size.display * typography.lineHeight.tight,
    letterSpacing: typography.tracking.tight,
  },
  h1: {
    fontSize: typography.size.h1,
    fontWeight: typography.weight.bold,
    color: fg.strong,
    lineHeight: typography.size.h1 * typography.lineHeight.tight,
    letterSpacing: typography.tracking.tight,
  },
  h2: {
    fontSize: typography.size.h2,
    fontWeight: typography.weight.bold,
    color: fg.strong,
    lineHeight: typography.size.h2 * typography.lineHeight.tight,
    letterSpacing: typography.tracking.snug,
  },
  h3: {
    fontSize: typography.size.h3,
    fontWeight: typography.weight.bold,
    color: fg.strong,
    lineHeight: typography.size.h3 * typography.lineHeight.snug,
  },
  h4: {
    fontSize: typography.size.h4,
    fontWeight: typography.weight.semibold,
    color: fg.strong,
    lineHeight: typography.size.h4 * typography.lineHeight.snug,
  },
  body: {
    fontSize: typography.size.body,
    fontWeight: typography.weight.regular,
    color: fg.default,
    lineHeight: typography.size.body * typography.lineHeight.relaxed,
  },
  bodySm: {
    fontSize: typography.size.bodySm,
    fontWeight: typography.weight.regular,
    color: fg.default,
    lineHeight: typography.size.bodySm * typography.lineHeight.normal,
  },
  label: {
    fontSize: typography.size.label,
    fontWeight: typography.weight.semibold,
    color: fg.strong,
    letterSpacing: typography.tracking.wide,
  },
  caption: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.regular,
    color: fg.muted,
    lineHeight: typography.size.caption * typography.lineHeight.normal,
  },
  eyebrow: {
    fontSize: typography.size.caption,
    fontWeight: typography.weight.bold,
    color: accent.base,
    letterSpacing: typography.tracking.caps,
  },
});
