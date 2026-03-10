import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography } from '@/constants/theme';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color?: string;
  subtitle?: string;
}

export function DashboardCard({ title, value, icon, color = colors.primary, subtitle }: DashboardCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <MaterialIcons name={icon} size={28} color={color} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    fontWeight: '500',
  },
  value: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
