import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

export default function SplashScreen() {
  const sweep = useRef(new Animated.Value(0)).current;
  const breathA = useRef(new Animated.Value(0)).current;
  const breathB = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();

    const loopBreath = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: 3000,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

    loopBreath(breathA, 0).start();
    loopBreath(breathB, 1500).start();

    const t = setTimeout(() => {
      router.replace('/(auth)/role-choice');
    }, 2500);

    return () => clearTimeout(t);
  }, [sweep, breathA, breathB, rise]);

  const sweepX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 220],
  });
  const haloAScale = breathA.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const haloBScale = breathB.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const haloAOpacity = breathA.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const haloBOpacity = breathB.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });
  const riseY = rise.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <View style={s.root}>
      <Animated.View
        style={[
          s.halo,
          s.haloRed,
          { opacity: haloAOpacity, transform: [{ scale: haloAScale }] },
        ]}
      />
      <Animated.View
        style={[
          s.halo,
          s.haloBlue,
          { opacity: haloBOpacity, transform: [{ scale: haloBScale }] },
        ]}
      />

      <Animated.View
        style={[
          s.stack,
          { opacity: rise, transform: [{ translateY: riseY }] },
        ]}
      >
        <View style={s.markWrap}>
          <View style={s.markGlow} />
          <Image
            source={require('../../assets/logo-mark-white.png')}
            style={s.mark}
            resizeMode="contain"
          />
        </View>

        <Text style={s.wordmark}>
          <Text style={s.wordmarkCar}>Car</Text>
          <Text style={s.wordmarkLink}>Link</Text>
        </Text>

        <Text style={s.tagline}>Le lien de confiance auto</Text>
      </Animated.View>

      <View style={s.loaderTrack}>
        <Animated.View
          style={[s.loaderSweep, { transform: [{ translateX: sweepX }] }]}
        />
      </View>

      <Text style={s.version}>V 1.0 · CAMEROUN</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0E15',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  halo: {
    position: 'absolute',
    borderRadius: 999,
  },
  haloRed: {
    width: 360,
    height: 360,
    top: '6%',
    left: '-30%',
    backgroundColor: 'rgba(200,16,46,0.5)',
  },
  haloBlue: {
    width: 300,
    height: 300,
    bottom: '8%',
    right: '-28%',
    backgroundColor: 'rgba(60,120,210,0.32)',
  },
  stack: {
    alignItems: 'center',
    gap: 22,
    zIndex: 2,
  },
  markWrap: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGlow: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: 'rgba(200,16,46,0.22)',
  },
  mark: {
    width: 72,
    height: 72,
  },
  wordmark: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.1,
    lineHeight: 38,
  },
  wordmarkCar: {
    color: '#C8102E',
  },
  wordmarkLink: {
    color: '#FFFFFF',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.3,
  },
  loaderTrack: {
    position: 'absolute',
    bottom: 56,
    width: 132,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  loaderSweep: {
    width: 50,
    height: '100%',
    backgroundColor: '#C8102E',
    borderRadius: 2,
    opacity: 0.9,
  },
  version: {
    position: 'absolute',
    bottom: 24,
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 1.6,
  },
});
