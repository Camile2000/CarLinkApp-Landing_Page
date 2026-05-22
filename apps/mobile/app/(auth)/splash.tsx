import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Logo } from '../../src/components/ui/Logo';
import { Caption } from '../../src/components/ui/Typography';
import { palette, spacing } from '../../src/constants/theme';

export default function SplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;
  const loaderWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.timing(loaderWidth, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      router.replace('/(auth)/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.center, { opacity: fade }]}>
        <Logo
          size={80}
          tone="white"
          showWordmark
          showTagline
          taglineColor="rgba(255,255,255,0.55)"
        />
      </Animated.View>

      <View style={styles.bottom}>
        <View style={styles.loaderTrack}>
          <Animated.View
            style={[
              styles.loaderFill,
              {
                width: loaderWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Caption color="rgba(255,255,255,0.35)" align="center">
          v 1.0 · Cameroun
        </Caption>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.navy[900],
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottom: {
    width: '100%',
    paddingHorizontal: spacing[10],
    paddingBottom: spacing[10],
    gap: spacing[3],
    alignItems: 'center',
  },
  loaderTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderFill: {
    height: 2,
    backgroundColor: 'rgba(200,16,46,0.8)',
    borderRadius: 2,
  },
});
