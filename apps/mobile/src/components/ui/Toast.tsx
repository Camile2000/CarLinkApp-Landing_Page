import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from 'lucide-react-native';
import { palette, radius, semantic, shadow } from '../../constants/theme';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
  index: number;
}

const VARIANT_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: semantic.success,
    duration: 3000,
  },
  error: {
    icon: XCircle,
    bg: semantic.danger,
    duration: 5000,
  },
  warning: {
    icon: AlertTriangle,
    bg: semantic.warning,
    duration: 4000,
  },
  info: {
    icon: Info,
    bg: semantic.info,
    duration: 3000,
  },
} as const;

export function Toast({ toast, onDismiss, index }: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const cfg = VARIANT_CONFIG[toast.variant];
  const Icon = cfg.icon;
  const duration = toast.duration ?? cfg.duration;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 220,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: cfg.bg,
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
          marginTop: index === 0 ? 0 : 8,
        },
      ]}
    >
      <Pressable onPress={handleDismiss} style={styles.inner} hitSlop={4}>
        <View style={styles.iconWrap}>
          <Icon size={20} color={palette.neutral[0]} strokeWidth={2.4} />
        </View>
        <Text style={styles.message} numberOfLines={3}>
          {toast.message}
        </Text>
        <View style={styles.closeBtn}>
          <X size={16} color="rgba(255,255,255,0.85)" strokeWidth={2.4} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    ...shadow.md,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: palette.neutral[0],
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
