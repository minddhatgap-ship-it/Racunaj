import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { useData } from '@/hooks/useData';
import { formatCurrency } from '@/services/calculations';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function ManageServicesScreen() {
  const router = useRouter();
  const { services } = useData();
  const [filter, setFilter] = useState<'all' | 'service' | 'product'>('all');

  const filteredServices = services.filter(s => {
    if (filter === 'service') return s.category === 'service';
    if (filter === 'product') return s.category === 'product';
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Storitve & Izdelki</Text>
        <Pressable onPress={() => router.push('/new-service')} style={styles.addButton}>
          <MaterialIcons name="add-circle" size={32} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        <Pressable
          style={[styles.filterBtn, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Vse
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, filter === 'service' && styles.filterActive]}
          onPress={() => setFilter('service')}
        >
          <Text style={[styles.filterText, filter === 'service' && styles.filterTextActive]}>
            Storitve
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, filter === 'product' && styles.filterActive]}
          onPress={() => setFilter('product')}
        >
          <Text style={[styles.filterText, filter === 'product' && styles.filterTextActive]}>
            Izdelki
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredServices}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <MaterialIcons 
                  name={item.category === 'service' ? 'build' : 'inventory-2'} 
                  size={24} 
                  color={colors.primary} 
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.description}>{item.description}</Text>
                  )}
                  <Text style={styles.meta}>{item.unit} · DDV {item.ddvRate}%</Text>
                </View>
              </View>
              <Text style={styles.price}>{formatCurrency(item.price)}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="inventory" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>Ni storitev</Text>
            <Text style={styles.emptySubtext}>Pritisnite + za dodajanje</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  addButton: {
    padding: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  filterBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
  },
  cardInfo: {
    flex: 1,
  },
  serviceName: {
    ...typography.h3,
    color: colors.text,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  meta: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  price: {
    ...typography.h2,
    color: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.h2,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
