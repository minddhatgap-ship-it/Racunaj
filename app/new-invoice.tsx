import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useData } from '@/hooks/useData';
import { useAlert } from '@/template';
import { calculateInvoiceItem, calculateInvoiceTotals, formatCurrency } from '@/services/calculations';
import { DOCUMENT_TYPES } from '@/constants/config';
import type { InvoiceItem, Client, Service } from '@/types';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function NewInvoiceScreen() {
  const router = useRouter();
  const { clients, services, addInvoice } = useData();
  const { showAlert } = useAlert();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [type, setType] = useState<keyof typeof DOCUMENT_TYPES>('INVOICE');
  const [notes, setNotes] = useState('');
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  // Sort services by usage count (most used first)
  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => b.usageCount - a.usageCount);
  }, [services]);

  const topServices = sortedServices.slice(0, 6);
  const otherServices = sortedServices.slice(6);

  const addItem = (service: Service) => {
    const calculations = calculateInvoiceItem(1, service.price, service.ddvRate);
    const newItem: InvoiceItem = {
      serviceId: service.id,
      serviceName: service.name,
      description: service.description,
      quantity: 1,
      unit: service.unit,
      pricePerUnit: service.price,
      ddvRate: service.ddvRate,
      ...calculations,
    };
    setItems([...items, newItem]);
    setShowServicePicker(false);
  };

  const updateItemQuantity = (index: number, quantity: string) => {
    const qty = parseFloat(quantity) || 0;
    const item = items[index];
    const calculations = calculateInvoiceItem(qty, item.pricePerUnit, item.ddvRate);
    const updated = [...items];
    updated[index] = { ...item, quantity: qty, ...calculations };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedClient) {
      showAlert('Napaka', 'Prosim izberite stranko');
      return;
    }
    if (items.length === 0) {
      showAlert('Napaka', 'Dodajte vsaj eno postavko');
      return;
    }

    const totals = calculateInvoiceTotals(items);
    const now = Date.now();
    const dueDate = now + 15 * 24 * 60 * 60 * 1000; // 15 dni

    await addInvoice({
      type: DOCUMENT_TYPES[type],
      clientId: selectedClient.id,
      clientData: selectedClient,
      items,
      issueDate: now,
      dueDate,
      paymentMethod: 'Transakcijski račun',
      notes: notes || undefined,
      subtotal: totals.subtotal,
      totalDDV: totals.totalDDV,
      total: totals.total,
      isPaid: false,
    });

    router.back();
  };

  const totals = calculateInvoiceTotals(items);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Client Selection */}
            <Text style={styles.sectionTitle}>Stranka</Text>
            {selectedClient ? (
              <Card style={styles.selectedClient}>
                <View style={styles.clientHeader}>
                  <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{selectedClient.name}</Text>
                    <Text style={styles.clientType}>
                      {selectedClient.type === 'individual' ? 'Fizična oseba' : 'Pravna oseba'}
                    </Text>
                    <Text style={styles.clientAddress}>{selectedClient.address}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedClient(null)} style={styles.changeButton}>
                    <MaterialIcons name="edit" size={20} color={colors.primary} />
                  </Pressable>
                </View>
              </Card>
            ) : (
              <Button
                title="Izberi stranko"
                onPress={() => setShowClientPicker(!showClientPicker)}
                variant="outline"
              />
            )}

            {showClientPicker && (
              <ScrollView style={styles.picker} nestedScrollEnabled>
                {clients.map(client => (
                  <Pressable
                    key={client.id}
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedClient(client);
                      setShowClientPicker(false);
                    }}
                  >
                    <View>
                      <Text style={styles.pickerItemText}>{client.name}</Text>
                      <Text style={styles.pickerItemSubtext}>
                        {client.type === 'individual' ? 'Fizična' : 'Pravna'} · {client.city}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Items */}
            <Text style={styles.sectionTitle}>Postavke</Text>
            {items.map((item, index) => (
              <Card key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.serviceName}</Text>
                  <Pressable onPress={() => removeItem(index)}>
                    <MaterialIcons name="close" size={20} color={colors.danger} />
                  </Pressable>
                </View>
                <View style={styles.itemRow}>
                  <Input
                    label="Količina"
                    value={item.quantity.toString()}
                    onChangeText={(val) => updateItemQuantity(index, val)}
                    keyboardType="decimal-pad"
                    style={styles.quantityInput}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemLabel}>Cena: {formatCurrency(item.pricePerUnit)}</Text>
                    <Text style={styles.itemTotal}>Skupaj: {formatCurrency(item.totalWithDDV)}</Text>
                  </View>
                </View>
              </Card>
            ))}

            {/* Quick Add - Top 6 Services */}
            {topServices.length > 0 && (
              <>
                <Text style={styles.quickAddTitle}>Pogoste postavke</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.quickServices}
                  contentContainerStyle={styles.quickServicesContent}
                >
                  {topServices.map(service => (
                    <Pressable
                      key={service.id}
                      style={styles.quickServiceCard}
                      onPress={() => addItem(service)}
                    >
                      <MaterialIcons 
                        name={service.category === 'service' ? 'build' : 'inventory-2'} 
                        size={24} 
                        color={colors.primary} 
                      />
                      <Text style={styles.quickServiceName}>{service.name}</Text>
                      <Text style={styles.quickServicePrice}>{formatCurrency(service.price)}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* All Services Button */}
            <Button
              title={showServicePicker ? 'Skrij vse postavke' : 'Prikaži vse postavke'}
              onPress={() => setShowServicePicker(!showServicePicker)}
              variant="outline"
              icon={<MaterialIcons name={showServicePicker ? 'expand-less' : 'expand-more'} size={20} color={colors.primary} />}
            />

            {showServicePicker && (
              <ScrollView style={styles.picker} nestedScrollEnabled>
                {sortedServices.map(service => (
                  <Pressable
                    key={service.id}
                    style={styles.pickerItem}
                    onPress={() => addItem(service)}
                  >
                    <View style={styles.servicePickerInfo}>
                      <View style={styles.servicePickerLeft}>
                        <MaterialIcons 
                          name={service.category === 'service' ? 'build' : 'inventory-2'} 
                          size={20} 
                          color={colors.textSecondary} 
                        />
                        <View>
                          <Text style={styles.pickerItemText}>{service.name}</Text>
                          <Text style={styles.pickerItemSubtext}>
                            {service.category === 'service' ? 'Storitev' : 'Izdelek'} · {service.unit}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.pickerItemPrice}>{formatCurrency(service.price)}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Totals */}
            {items.length > 0 && (
              <Card style={styles.totalsCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Brez DDV:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>DDV:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totals.totalDDV)}</Text>
                </View>
                <View style={[styles.totalRow, styles.totalRowFinal]}>
                  <Text style={styles.totalLabelFinal}>SKUPAJ:</Text>
                  <Text style={styles.totalValueFinal}>{formatCurrency(totals.total)}</Text>
                </View>
              </Card>
            )}

            {/* Notes */}
            <Input
              label="Opombe"
              value={notes}
              onChangeText={setNotes}
              placeholder="Dodatne opombe na računu..."
              multiline
              numberOfLines={3}
            />

            <Button title="Shrani račun" onPress={handleSave} size="large" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  form: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  selectedClient: {
    marginBottom: spacing.md,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  clientType: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  clientAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  changeButton: {
    padding: spacing.sm,
  },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    maxHeight: 250,
  },
  pickerItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  pickerItemSubtext: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  pickerItemPrice: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  servicePickerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  itemCard: {
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  quantityInput: {
    flex: 1,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  itemLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  itemTotal: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  quickAddTitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  quickServices: {
    marginBottom: spacing.md,
  },
  quickServicesContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  quickServiceCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    width: 100,
  },
  quickServiceName: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  quickServicePrice: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  totalsCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
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
    ...typography.h3,
    color: colors.text,
  },
  totalValueFinal: {
    ...typography.h2,
    color: colors.primary,
  },
});
