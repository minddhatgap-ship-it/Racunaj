import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useData } from '@/hooks/useData';
import { useSettings } from '@/hooks/useSettings';
import { useAlert } from '@/template';
import { calculateInvoiceItem, calculateInvoiceTotals, formatCurrency } from '@/services/calculations';
import type { InvoiceItem, Service } from '@/types';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function IssueInvoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clients, services, addInvoice, addClient, addService } = useData();
  const { settings } = useSettings();
  const { showAlert } = useAlert();

  const [clientType, setClientType] = useState<'individual' | 'company'>('individual');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [clientTaxNumber, setClientTaxNumber] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);

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
  };

  const updateQuantity = (index: number, quantity: string) => {
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

  const handleIssue = async () => {
    if (!clientName) {
      showAlert('Napaka', 'Vnesite ime stranke');
      return;
    }
    
    if (clientType === 'company') {
      if (!clientAddress || !clientCity || !clientPostalCode || !clientTaxNumber) {
        showAlert('Napaka', 'Za pravno osebo izpolnite vse obvezne podatke');
        return;
      }
    }
    
    if (items.length === 0) {
      showAlert('Napaka', 'Dodajte vsaj eno postavko');
      return;
    }

    // Create or find client
    let client = clients.find(c => c.name === clientName);
    if (!client) {
      await addClient({
        name: clientName,
        type: clientType,
        address: clientAddress || 'Neznano',
        city: clientCity || 'Neznano',
        postalCode: clientPostalCode || '0000',
        taxNumber: clientTaxNumber || undefined,
        email: clientEmail || undefined,
        phone: clientPhone || undefined,
      });
      // Reload to get new client
      const updatedClients = await import('@/services/storage').then(s => s.getClients());
      client = updatedClients.find(c => c.name === clientName)!;
    }

    const totals = calculateInvoiceTotals(items);
    const now = Date.now();

    await addInvoice({
      type: 'invoice',
      clientId: client.id,
      clientData: client,
      items,
      issueDate: now,
      dueDate: now + 15 * 24 * 60 * 60 * 1000,
      paymentMethod: 'Transakcijski račun',
      subtotal: totals.subtotal,
      totalDDV: totals.totalDDV,
      total: totals.total,
      isPaid: false,
    });

    showAlert('Uspeh', 'Račun uspešno izdan', [
      { text: 'V redu', onPress: () => router.back() },
    ]);
  };

  const totals = calculateInvoiceTotals(items);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Izdaja računa</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Client Section */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Stranka</Text>
            
            <View style={styles.typeButtons}>
              <Pressable
                style={[styles.typeButton, clientType === 'individual' && styles.typeButtonActive]}
                onPress={() => setClientType('individual')}
              >
                <MaterialIcons 
                  name="person" 
                  size={24} 
                  color={clientType === 'individual' ? colors.text : colors.textSecondary} 
                />
                <Text style={[styles.typeButtonText, clientType === 'individual' && styles.typeButtonTextActive]}>
                  Fizična oseba
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeButton, clientType === 'company' && styles.typeButtonActive]}
                onPress={() => setClientType('company')}
              >
                <MaterialIcons 
                  name="business" 
                  size={24} 
                  color={clientType === 'company' ? colors.text : colors.textSecondary} 
                />
                <Text style={[styles.typeButtonText, clientType === 'company' && styles.typeButtonTextActive]}>
                  Pravna oseba
                </Text>
              </Pressable>
            </View>

            <Input
              label="Ime stranke *"
              value={clientName}
              onChangeText={setClientName}
              placeholder={clientType === 'individual' ? 'Janez Novak' : 'Podjetje d.o.o.'}
            />
            
            {clientType === 'company' && (
              <>
                <Input
                  label="Naslov *"
                  value={clientAddress}
                  onChangeText={setClientAddress}
                  placeholder="Slovenska cesta 1"
                />
                <View style={styles.row}>
                  <Input
                    label="Poštna št. *"
                    value={clientPostalCode}
                    onChangeText={setClientPostalCode}
                    placeholder="1000"
                    style={styles.halfInput}
                    keyboardType="number-pad"
                  />
                  <Input
                    label="Mesto *"
                    value={clientCity}
                    onChangeText={setClientCity}
                    placeholder="Ljubljana"
                    style={styles.halfInput}
                  />
                </View>
                <Input
                  label="Davčna številka *"
                  value={clientTaxNumber}
                  onChangeText={setClientTaxNumber}
                  placeholder="SI12345678"
                />
                <Input
                  label="E-pošta"
                  value={clientEmail}
                  onChangeText={setClientEmail}
                  placeholder="info@podjetje.si"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Input
                  label="Telefon"
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  placeholder="+386 1 234 5678"
                  keyboardType="phone-pad"
                />
              </>
            )}
          </Card>

          {/* Items Section */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Postavke</Text>
            
            {items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.serviceName}</Text>
                  <Pressable onPress={() => removeItem(index)} hitSlop={8}>
                    <MaterialIcons name="close" size={24} color={colors.danger} />
                  </Pressable>
                </View>
                <View style={styles.itemRow}>
                  <Input
                    label="Količina"
                    value={item.quantity.toString()}
                    onChangeText={(val) => updateQuantity(index, val)}
                    keyboardType="decimal-pad"
                    style={styles.qtyInput}
                  />
                  <View style={styles.itemTotals}>
                    <Text style={styles.itemPrice}>{formatCurrency(item.pricePerUnit)}/{item.unit}</Text>
                    <Text style={styles.itemTotal}>{formatCurrency(item.totalWithDDV)}</Text>
                  </View>
                </View>
              </View>
            ))}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
              {services.map(service => (
                <Pressable
                  key={service.id}
                  style={styles.serviceChip}
                  onPress={() => addItem(service)}
                >
                  <MaterialIcons 
                    name={service.category === 'service' ? 'build' : 'inventory-2'} 
                    size={20} 
                    color={colors.primary} 
                  />
                  <Text style={styles.serviceChipText}>{service.name}</Text>
                  <Text style={styles.serviceChipPrice}>{formatCurrency(service.price)}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Button
              title="Upravljaj storitve/izdelke"
              onPress={() => router.push('/manage-services')}
              variant="outline"
              icon={<MaterialIcons name="settings" size={20} color={colors.primary} />}
            />
          </Card>

          {/* Totals */}
          {items.length > 0 && (
            <Card style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Brez DDV:</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>DDV ({settings.company.taxSystem === 'ddv' ? '22%' : '0%'}):</Text>
                <Text style={styles.totalValue}>{formatCurrency(totals.totalDDV)}</Text>
              </View>
              <View style={[styles.totalRow, styles.totalRowFinal]}>
                <Text style={styles.totalFinal}>SKUPAJ:</Text>
                <Text style={styles.totalFinalValue}>{formatCurrency(totals.total)}</Text>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button
          title="Izdaj račun"
          onPress={handleIssue}
          size="large"
          icon={<MaterialIcons name="check-circle" size={24} color={colors.text} />}
        />
      </View>
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
  scroll: {
    flex: 1,
  },
  form: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  qtyInput: {
    flex: 1,
  },
  itemTotals: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemPrice: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  itemTotal: {
    ...typography.h3,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  servicesScroll: {
    marginBottom: spacing.md,
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  serviceChip: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
  },
  serviceChipText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  serviceChipPrice: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  totalsCard: {
    backgroundColor: colors.surface,
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
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  totalFinal: {
    ...typography.h2,
    color: colors.text,
  },
  totalFinalValue: {
    ...typography.h1,
    color: colors.primary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
