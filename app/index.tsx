import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="account-balance" size={48} color={colors.fursOrange} />
          <Text style={styles.title}>Računovodstvo</Text>
          <Text style={styles.subtitle}>Profesionalna rešitev za s.p.</Text>
        </View>

        <View style={styles.menu}>
          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              styles.primaryCard,
              pressed && styles.menuCardPressed,
            ]}
            onPress={() => router.push('/issue-invoice')}
          >
            <MaterialIcons name="add-circle" size={56} color={colors.text} />
            <Text style={styles.menuTitle}>Izdaja računov</Text>
            <Text style={styles.menuDescription}>
              Hitro izdajte račun, predračun ali dobavnico
            </Text>
          </Pressable>

          <View style={styles.gridRow}>
            <Pressable
              style={({ pressed }) => [
                styles.menuCard,
                styles.gridCard,
                styles.secondaryCard,
                pressed && styles.menuCardPressed,
              ]}
              onPress={() => router.push('/invoices')}
            >
              <MaterialIcons name="receipt-long" size={40} color={colors.text} />
              <Text style={styles.gridTitle}>Računi</Text>
              <Text style={styles.gridDescription}>Pregled</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuCard,
                styles.gridCard,
                styles.accentCard,
                pressed && styles.menuCardPressed,
              ]}
              onPress={() => router.push('/manage-services')}
            >
              <MaterialIcons name="inventory" size={40} color={colors.text} />
              <Text style={styles.gridTitle}>Zaloga</Text>
              <Text style={styles.gridDescription}>Izdelki</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              styles.secondaryCard,
              pressed && styles.menuCardPressed,
            ]}
            onPress={() => router.push('/business-overview')}
          >
            <MaterialIcons name="analytics" size={48} color={colors.text} />
            <Text style={styles.menuTitle}>Pregled poslovanja</Text>
            <Text style={styles.menuDescription}>
              Statistika in izvozi
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              styles.tertiaryCard,
              pressed && styles.menuCardPressed,
            ]}
            onPress={() => router.push('/settings')}
          >
            <MaterialIcons name="settings" size={48} color={colors.text} />
            <Text style={styles.menuTitle}>Nastavitve</Text>
            <Text style={styles.menuDescription}>
              Podjetje, davčni sistem, tema
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menu: {
    flex: 1,
    gap: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
    height: 140,
  },
  menuCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gridCard: {
    flex: 1,
    padding: spacing.md,
  },
  primaryCard: {
    backgroundColor: colors.fursOrange,
    borderColor: colors.fursOrange,
    minHeight: 160,
  },
  secondaryCard: {
    backgroundColor: colors.fursBlue,
    borderColor: colors.fursBlue,
  },
  accentCard: {
    backgroundColor: colors.fursGreen,
    borderColor: colors.fursGreen,
  },
  tertiaryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  menuCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  menuTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  menuDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  gridTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '700',
  },
  gridDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
