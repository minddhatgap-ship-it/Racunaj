import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <MaterialIcons name="account-balance" size={40} color={colors.primary} />
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
              <MaterialIcons name="add-circle" size={32} color={colors.text} />
              <Text style={styles.menuTitle}>Izdaja računov</Text>
              <Text style={styles.menuDescription}>
                Izdajte račun s FURS potrditvijo
              </Text>
            </Pressable>

            <View style={styles.gridRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuCard,
                  styles.gridCard,
                  pressed && styles.menuCardPressed,
                ]}
                onPress={() => router.push('/invoices')}
              >
                <MaterialIcons name="receipt-long" size={28} color={colors.primary} />
                <Text style={styles.gridTitle}>Računi</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.menuCard,
                  styles.gridCard,
                  pressed && styles.menuCardPressed,
                ]}
                onPress={() => router.push('/manage-services')}
              >
                <MaterialIcons name="inventory" size={28} color={colors.secondary} />
                <Text style={styles.gridTitle}>Zaloga</Text>
              </Pressable>
            </View>

            <View style={styles.gridRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuCard,
                  styles.gridCard,
                  pressed && styles.menuCardPressed,
                ]}
                onPress={() => router.push('/business-overview')}
              >
                <MaterialIcons name="analytics" size={28} color={colors.success} />
                <Text style={styles.gridTitle}>Pregled</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.menuCard,
                  styles.gridCard,
                  pressed && styles.menuCardPressed,
                ]}
                onPress={() => router.push('/settings')}
              >
                <MaterialIcons name="settings" size={28} color={colors.textSecondary} />
                <Text style={styles.gridTitle}>Nastavitve</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  menu: {
    gap: spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  menuCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  gridCard: {
    flex: 1,
    minHeight: 100,
  },
  primaryCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    minHeight: 130,
  },
  menuCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  menuTitle: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  menuDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  gridTitle: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
});
