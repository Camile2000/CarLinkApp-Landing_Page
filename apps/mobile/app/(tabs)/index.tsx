import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Car, FileText, BookOpen, User, LogOut } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Screen } from '../../src/components/ui/Screen';
import { H3, BodySm, Caption, Eyebrow } from '../../src/components/ui/Typography';
import { Card } from '../../src/components/ui/Card';
import {
  accent,
  bg,
  border,
  fg,
  palette,
  radius,
  shadow,
  spacing,
} from '../../src/constants/theme';

const SERVICES = [
  { icon: Car, label: 'Garages', sub: 'Trouver' },
  { icon: FileText, label: 'Devis', sub: 'Demander' },
  { icon: BookOpen, label: 'Carnet', sub: 'Entretien' },
  { icon: User, label: 'Profil', sub: 'Mon compte' },
];

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'vous';

  return (
    <View style={styles.root}>
      {/* Top app bar — navy */}
      <View style={styles.appBar}>
        <View style={styles.appBarInner}>
          <View>
            <Caption color="rgba(255,255,255,0.55)">Bonjour</Caption>
            <H3 color="#fff">{firstName} 👋</H3>
          </View>
          <Pressable onPress={signOut} hitSlop={8} style={styles.signOutBtn}>
            <LogOut size={20} color="rgba(255,255,255,0.7)" strokeWidth={1.75} />
          </Pressable>
        </View>
      </View>

      <Screen tone="paper" edges={['bottom']} style={styles.content}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Quick actions */}
          <View style={styles.section}>
            <Eyebrow style={styles.sectionLabel}>Services</Eyebrow>
            <View style={styles.serviceGrid}>
              {SERVICES.map((s) => (
                <Pressable key={s.label} style={styles.serviceCard}>
                  <View style={styles.serviceIcon}>
                    <s.icon size={22} color={accent.base} strokeWidth={1.75} />
                  </View>
                  <BodySm weight="600" color={fg.strong} style={styles.serviceLabel}>
                    {s.label}
                  </BodySm>
                  <Caption color={fg.muted}>{s.sub}</Caption>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Placeholder lot 3 */}
          <View style={styles.section}>
            <Eyebrow style={styles.sectionLabel}>Activité récente</Eyebrow>
            <Card style={styles.placeholder}>
              <View style={styles.placeholderInner}>
                <FileText size={32} color={palette.neutral[300]} strokeWidth={1.5} />
                <BodySm color={fg.muted} align="center" style={{ marginTop: spacing[3] }}>
                  Aucun devis pour l'instant.
                </BodySm>
                <Caption color={fg.subtle} align="center">
                  Lancez votre première demande pour voir les propositions.
                </Caption>
              </View>
            </Card>
          </View>
        </ScrollView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appBar: {
    backgroundColor: fg.strong,
    paddingTop: 56,
    paddingBottom: spacing[4],
  },
  appBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
  },
  signOutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[8],
    gap: spacing[6],
  },
  section: { gap: spacing[3] },
  sectionLabel: { marginBottom: spacing[1] },
  serviceGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  serviceCard: {
    flex: 1,
    backgroundColor: bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: border.subtle,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[2],
    alignItems: 'center',
    gap: 4,
    ...shadow.xs,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.red[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  serviceLabel: { fontSize: 12 },
  placeholder: {
    minHeight: 160,
    justifyContent: 'center',
  },
  placeholderInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[6],
  },
});
