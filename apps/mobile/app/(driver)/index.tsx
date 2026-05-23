import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';

export default function DriverHome() {
  const { profile } = useAuth();

  return (
    <View style={s.root}>
      <Text style={s.greeting}>
        Bonjour{profile?.full_name ? `, ${profile.full_name}` : ''} 👋
      </Text>
      <Text style={s.sub}>Espace conducteur — à venir</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0E15',
    padding: 24,
  },
  greeting: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 8 },
});
