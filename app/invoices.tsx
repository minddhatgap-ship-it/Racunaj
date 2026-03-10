import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { useData } from '@/hooks/useData';
import { useSettings } from '@/hooks/useSettings';
import { useAlert } from '@/template';
import { TestModeWarning } from '@/components';
import { formatCurrency, formatDate } from '@/services/calculations';
import { generateFursData, stornoInvoiceOnFurs } from '@/services/furs';
import { generateInvoicePDF, printInvoice } from '@/services/pdf';
import type { Invoice } from '@/types';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function InvoicesScreen() {
  const router = useRouter();
  const { invoices, markInvoiceAsPaid, updateInvoice } = useData();
  const { settings } = useSettings();
  const { showAlert } = useAlert();
  
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = useMemo(() => {
    let result = invoices;
    
    // Filter by payment status
    if (filter === 'paid') {
      result = result.filter(inv => inv.isPaid);
    } else if (filter === 'unpaid') {
      result = result.filter(inv => !inv.isPaid);
    }
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.clientData.name.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [invoices, filter, searchQuery]);

  const handleMarkAsPaid = async (invoice: Invoice) => {
    showAlert('Označi kot plačano?', `Račun ${invoice.invoiceNumber}`, [
      { text: 'Prekliči', style: 'cancel' },
      {
        text: 'Označi',
        onPress: async () => {
          await markInvoiceAsPaid(invoice.id);
          showAlert('Uspeh', 'Račun označen kot plačan');
        },
      },
    ]);
  };

  const handleFiscalize = async (invoice: Invoice) => {
    try {
      const fursData = generateFursData(invoice, settings.company);
      await updateInvoice(invoice.id, { fursData });
      showAlert('Uspeh', 'Račun davčno potrjen', [
        {
          text: 'V redu',
          onPress: () => {
            // Osvežitev
          },
        },
      ]);
    } catch (error) {
      showAlert('Napaka', 'Napaka pri fiskalizaciji računa');
    }
  };

  const handleExportPDF = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF(invoice, settings.company, invoice.fursData);
    } catch (error) {
      showAlert('Napaka', 'Napaka pri generiranju PDF-ja');
    }
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      await printInvoice(invoice, settings.company, invoice.fursData);
    } catch (error) {
      showAlert('Napaka', 'Napaka pri tiskanju');
    }
  };

  const handleStornoInvoice = async (invoice: Invoice) => {
    showAlert('Storniraj račun?', `Račun ${invoice.invoiceNumber} bo storniran na FURS`, [
      { text: 'Prekliči', style: 'cancel' },
      {
        text: 'Storniraj',
        style: 'destructive',
        onPress: async () => {
          try {
            const stornoData = await stornoInvoiceOnFurs(
              invoice,
              settings.company,
              'Storno računa'
            );
            // V produkciji: ustvari nov storno račun
            showAlert('Uspeh', `Račun ${invoice.invoiceNumber} storniran`);
          } catch (error) {
            showAlert('Napaka', 'Napaka pri storniranju računa');
          }
        },
      },
    ]);
  };

  const showInvoiceActions = (invoice: Invoice) => {
    showAlert(
      `Račun ${invoice.invoiceNumber}`,
      'Izberite dejanje',
      [
        { text: 'Prekliči', style: 'cancel' },
        !invoice.fursData && {
          text: '🔒 Davčno potrdi',
          onPress: () => handleFiscalize(invoice),
        },
        invoice.fursData && {
          text: '❌ Storniraj račun',
          style: 'destructive',
          onPress: () => handleStornoInvoice(invoice),
        },
        {
          text: '📄 Izvozi PDF',
          onPress: () => handleExportPDF(invoice),
        },
        {
          text: '🖨️ Natisni',
          onPress: () => handlePrint(invoice),
        },
        !invoice.isPaid && {
          text: '✓ Označi plačano',
          onPress: () => handleMarkAsPaid(invoice),
        },
      ].filter(Boolean) as any
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TestModeWarning />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Računi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Išči po številki ali stranki..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.filters}>
        <Pressable
          style={[styles.filterBtn, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            Vsi ({invoices.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, filter === 'unpaid' && styles.filterActive]}
          onPress={() => setFilter('unpaid')}
        >
          <Text style={[styles.filterText, filter === 'unpaid' && styles.filterTextActive]}>
            Neplačani ({invoices.filter(i => !i.isPaid).length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.filterBtn, filter === 'paid' && styles.filterActive]}
          onPress={() => setFilter('paid')}
        >
          <Text style={[styles.filterText, filter === 'paid' && styles.filterTextActive]}>
            Plačani ({invoices.filter(i => i.isPaid).length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable onPress={() => showInvoiceActions(item)}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons 
                      name="receipt-long" 
                      size={24} 
                      color={item.isPaid ? colors.success : colors.warning} 
                    />
                    {item.fursData && (
                      <View style={styles.fursbadge}>
                        <MaterialIcons name="verified" size={12} color={colors.success} />
                      </View>
                    )}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
                    <Text style={styles.clientName}>{item.clientData.name}</Text>
                    <Text style={styles.date}>{formatDate(item.issueDate)}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
                  <View style={[styles.badge, item.isPaid ? styles.badgePaid : styles.badgeUnpaid]}>
                    <Text style={styles.badgeText}>
                      {item.isPaid ? 'Plačano' : 'Neplačano'}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="receipt" size={64} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Ni zadetkov' : 'Ni računov'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Poskusite drugačno iskanje' : 'Izdajte prvi račun'}
            </Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.bodySmall,
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
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: spacing.md,
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
  },
  fursbadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  cardInfo: {
    flex: 1,
  },
  invoiceNumber: {
    ...typography.h3,
    color: colors.text,
  },
  clientName: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  date: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.h2,
    color: colors.primary,
  },
  badge: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  badgePaid: {
    backgroundColor: colors.success + '20',
  },
  badgeUnpaid: {
    backgroundColor: colors.warning + '20',
  },
  badgeText: {
    ...typography.bodySmall,
    fontWeight: '600',
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
