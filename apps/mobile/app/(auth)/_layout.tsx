import { Stack } from 'expo-router';
import { colors } from '../../src/constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.navyDeep,
        },
        animationEnabled: false,
      }}
      initialRouteName="splash"
    >
      <Stack.Screen name="splash" options={{ gestureEnabled: false }} />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="role-choice" />
      <Stack.Screen name="signup-conductor" />
      <Stack.Screen name="signup-garage" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="new-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
