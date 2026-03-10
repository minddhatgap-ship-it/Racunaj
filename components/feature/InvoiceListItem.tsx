import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import type { Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/services/calculations';
import { DOCUMENT_TYPE_LABELS } from '@/constants/config';
import { colors, spacing, typography } from '@/constants/theme';

interface InvoiceListItemProps {
  invoice: Invoice;
  onPress: () => void;
  onMarkPaid?: () => void;
}

export function InvoiceListItem({ invoice, onPress, onMarkPaid }: InvoiceListItemProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.left}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.type}>{DOCUMENT_TYPE_LABELS[invoice.type]}</Text>
        </View>
        <View style={styles.right}>
          {invoice.isPaid ? (
            <View style={styles.paidBadge}>
              <MaterialIcons name="check-circle" size={16} color={colors.success} />
              <Text style={styles.paidText}>Plačano</Text>
            </View>
          ) : (
            <View style={styles.unpaidBadge}>
              <MaterialIcons name="access-time" size={16} color={colors.warning} />
              <Text style={styles.unpaidText}>Neplačano</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.clientName}>{invoice.clientData.name}</Text>
      <Text style={styles.date}>Izdano: {formatDate(invoice.issueDate)}</Text>

      <View style={styles.footer}>
        <Text style={styles.amount}>{formatCurrency(invoice.total)}</Text>
        {!invoice.isPaid && onMarkPaid && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMarkPaid();
            }}
            style={styles.markPaidButton}
          >
            <Text style={styles.markPaidText}>Označi kot plačano</Text>
          </Pressable>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  left: {
    flex: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
  invoiceNumber: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  type: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  paidText: {
    ...typography.caption,
    color: colors.success,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  unpaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  unpaidText: {
    ...typography.caption,
    color: colors.warning,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  clientName: {
    ...typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amount: {
    ...typography.h2,
    color: colors.primary,
  },
  markPaidButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  markPaidText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
});
