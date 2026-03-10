import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useData } from '@/hooks/useData';
import { formatCurrency, formatDate } from '@/services/calculations';
import { DEFAULT_COMPANY_DATA } from '@/constants/config';
import { colors, spacing, typography } from '@/constants/theme';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const { invoices } = useData();
  
  const invoice = invoices.find(inv => inv.id === id);

  if (!invoice) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Račun ni najden</Text>
      </SafeAreaView>
    );
  }

  const handleShare = async () => {
    await Share.share({
      message: `Račun ${invoice.invoiceNumber}\nStranka: ${invoice.clientData.name}\nZnesek: ${formatCurrency(invoice.total)}`,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <Card style={styles.headerCard}>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.issueDate}>Datum izdaje: {formatDate(invoice.issueDate)}</Text>
            <Text style={styles.dueDate}>Rok plačila: {formatDate(invoice.dueDate)}</Text>
          </Card>

          {/* Company Info */}
          <Card>
            <Text style={styles.cardTitle}>Izdajatelj</Text>
            <Text style={styles.companyName}>{DEFAULT_COMPANY_DATA.name}</Text>
            <Text style={styles.info}>{DEFAULT_COMPANY_DATA.address}</Text>
            <Text style={styles.info}>{DEFAULT_COMPANY_DATA.city}</Text>
            <Text style={styles.info}>Davčna št.: {DEFAULT_COMPANY_DATA.taxNumber}</Text>
          </Card>

          {/* Client Info */}
          <Card>
            <Text style={styles.cardTitle}>Prejemnik</Text>
            <Text style={styles.companyName}>{invoice.clientData.name}</Text>
            <Text style={styles.info}>{invoice.clientData.address}</Text>
            <Text style={styles.info}>
              {invoice.clientData.postalCode} {invoice.clientData.city}
            </Text>
            {invoice.clientData.taxNumber && (
              <Text style={styles.info}>Davčna št.: {invoice.clientData.taxNumber}</Text>
            )}
          </Card>

          {/* Items */}
          <Card>
            <Text style={styles.cardTitle}>Postavke</Text>
            {invoice.items.map((item, index) => (
              <View key={index} style={styles.item}>
                <Text style={styles.itemName}>{item.serviceName}</Text>
                {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
                <View style={styles.itemRow}>
                  <Text style={styles.itemDetail}>
                    {item.quantity} {item.unit} × {formatCurrency(item.pricePerUnit)}
                  </Text>
                  <Text style={styles.itemTotal}>{formatCurrency(item.totalWithDDV)}</Text>
                </View>
                <Text style={styles.itemDDV}>DDV {item.ddvRate}%: {formatCurrency(item.ddvAmount)}</Text>
              </View>
            ))}
          </Card>

          {/* Totals */}
          <Card style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Brez DDV:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>DDV:</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.totalDDV)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalLabelFinal}>ZA PLAČILO:</Text>
              <Text style={styles.totalValueFinal}>{formatCurrency(invoice.total)}</Text>
            </View>
          </Card>

          {/* Payment Info */}
          <Card>
            <Text style={styles.cardTitle}>Plačilo</Text>
            <Text style={styles.info}>IBAN: {DEFAULT_COMPANY_DATA.iban}</Text>
            <Text style={styles.info}>BIC: {DEFAULT_COMPANY_DATA.bic}</Text>
            <Text style={styles.info}>Namen: {invoice.invoiceNumber}</Text>
          </Card>

          {invoice.notes && (
            <Card>
              <Text style={styles.cardTitle}>Opombe</Text>
              <Text style={styles.notes}>{invoice.notes}</Text>
            </Card>
          )}

          <View style={styles.actions}>
            <Button title="Deli" onPress={handleShare} variant="outline" />
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
    padding: spacing.md,
  },
  errorText: {
    ...typography.h2,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  headerCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  invoiceNumber: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  issueDate: {
    ...typography.body,
    color: colors.textSecondary,
  },
  dueDate: {
    ...typography.body,
    color: colors.textSecondary,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  companyName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  info: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  item: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  itemDetail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  itemTotal: {
    ...typography.h3,
    color: colors.text,
  },
  itemDDV: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  totalsCard: {
    backgroundColor: colors.surfaceLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  totalValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  totalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabelFinal: {
    ...typography.h2,
    color: colors.text,
  },
  totalValueFinal: {
    ...typography.h1,
    color: colors.primary,
  },
  notes: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: spacing.md,
  },
});
