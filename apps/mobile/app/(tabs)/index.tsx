import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors, spacing } from '../../src/constants/colors';
import { Button } from '../../src/components/ui/Button';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenue sur CarLink</Text>
        <Text style={styles.subtitle}>
          Vous êtes connecté en tant que {user?.email}
        </Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Page d'accueil (Lot 3)
          </Text>
        </View>

        <Button
          label="Se déconnecter"
          onPress={signOut}
          variant="secondary"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: spacing[6],
  },
  placeholder: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  placeholderText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    marginBottom: spacing[4],
  },
});
