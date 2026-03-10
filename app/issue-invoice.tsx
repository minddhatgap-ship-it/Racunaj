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
import { generateFursData } from '@/services/furs';
import type { InvoiceItem, Service } from '@/types';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

type Step = 'client' | 'items' | 'confirm';

export default function IssueInvoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clients, services, addInvoice, addClient } = useData();
  const { settings } = useSettings();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<Step>('client');
  const [clientType, setClientType] = useState<'individual' | 'company'>('individual');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [clientTaxNumber, setClientTaxNumber] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [enableFurs, setEnableFurs] = useState(true);

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

  const handleNextStep = () => {
    if (step === 'client') {
      if (!clientName) {
        showAlert('Napaka', 'Vnesite ime stranke');
        return;
      }
      if (clientType === 'company' && (!clientAddress || !clientCity || !clientPostalCode || !clientTaxNumber)) {
        showAlert('Napaka', 'Za pravno osebo izpolnite vse obvezne podatke');
        return;
      }
      setStep('items');
    } else if (step === 'items') {
      if (items.length === 0) {
        showAlert('Napaka', 'Dodajte vsaj eno postavko');
        return;
      }
      setStep('confirm');
    }
  };

  const handleIssue = async () => {
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
      const updatedClients = await import('@/services/storage').then(s => s.getClients());
      client = updatedClients.find(c => c.name === clientName)!;
    }

    const totals = calculateInvoiceTotals(items);
    const now = Date.now();

    const newInvoice = {
      type: 'invoice' as const,
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
      fursData: undefined,
    };

    // FURS potrjevanje
    if (enableFurs) {
      const fursData = generateFursData(
        { ...newInvoice, id: 'temp', invoiceNumber: `R-${Date.now()}` } as any,
        settings.company
      );
      newInvoice.fursData = fursData;
    }

    await addInvoice(newInvoice);

    showAlert(
      'Račun izdan!', 
      enableFurs ? 'Račun je davčno potrjen in shranjen.' : 'Račun je shranjen.',
      [{ text: 'V redu', onPress: () => router.back() }]
    );
  };

  const totals = calculateInvoiceTotals(items);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => step === 'client' ? router.back() : setStep(step === 'confirm' ? 'items' : 'client')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Izdaja računa</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 'client' && styles.stepActive]}>
            <Text style={styles.stepNumber}>1</Text>
          </View>
          <Text style={[styles.stepLabel, step === 'client' && styles.stepLabelActive]}>Stranka</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 'items' && styles.stepActive]}>
            <Text style={styles.stepNumber}>2</Text>
          </View>
          <Text style={[styles.stepLabel, step === 'items' && styles.stepLabelActive]}>Postavke</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 'confirm' && styles.stepActive]}>
            <Text style={styles.stepNumber}>3</Text>
          </View>
          <Text style={[styles.stepLabel, step === 'confirm' && styles.stepLabelActive]}>Potrditev</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Step 1: Client */}
          {step === 'client' && (
            <Card style={styles.section}>
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
          )}

          {/* Step 2: Items */}
          {step === 'items' && (
            <Card style={styles.section}>
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

              <Text style={styles.sectionTitle}>Dodaj izdelke/storitve</Text>
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
                size="small"
                icon={<MaterialIcons name="settings" size={18} color={colors.primary} />}
              />
            </Card>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && (
            <>
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Stranka</Text>
                <Text style={styles.confirmText}>{clientName}</Text>
                {clientType === 'company' && clientTaxNumber && (
                  <Text style={styles.confirmSubtext}>Davčna št.: {clientTaxNumber}</Text>
                )}
              </Card>

              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Postavke ({items.length})</Text>
                {items.map((item, index) => (
                  <View key={index} style={styles.confirmItem}>
                    <Text style={styles.confirmItemName}>{item.serviceName}</Text>
                    <Text style={styles.confirmItemQty}>{item.quantity} × {formatCurrency(item.pricePerUnit)}</Text>
                    <Text style={styles.confirmItemTotal}>{formatCurrency(item.totalWithDDV)}</Text>
                  </View>
                ))}
              </Card>

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
                  <Text style={styles.totalFinal}>SKUPAJ:</Text>
                  <Text style={styles.totalFinalValue}>{formatCurrency(totals.total)}</Text>
                </View>
              </Card>

              <Card style={styles.fursCard}>
                <Pressable 
                  style={styles.fursToggle}
                  onPress={() => setEnableFurs(!enableFurs)}
                >
                  <View style={styles.fursLeft}>
                    <MaterialIcons 
                      name={enableFurs ? 'check-box' : 'check-box-outline-blank'} 
                      size={24} 
                      color={enableFurs ? colors.success : colors.textMuted} 
                    />
                    <View style={styles.fursInfo}>
                      <Text style={styles.fursTitle}>FURS davčno potrjevanje</Text>
                      <Text style={styles.fursDesc}>Račun bo fiskaliziran in pridobil ZOI, EOR oznake</Text>
                    </View>
                  </View>
                  <MaterialIcons name="verified" size={24} color={enableFurs ? colors.success : colors.textMuted} />
                </Pressable>
              </Card>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {step !== 'confirm' ? (
          <Button
            title="Naprej"
            onPress={handleNextStep}
            size="medium"
            icon={<MaterialIcons name="arrow-forward" size={20} color={colors.text} />}
          />
        ) : (
          <Button
            title={enableFurs ? 'Izdaj in potrdi na FURS' : 'Izdaj račun'}
            onPress={handleIssue}
            size="medium"
            icon={<MaterialIcons name={enableFurs ? 'verified' : 'check-circle'} size={20} color={colors.text} />}
          />
        )}
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepNumber: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  form: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
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
    paddingVertical: spacing.md,
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
  confirmText: {
    ...typography.h3,
    color: colors.text,
  },
  confirmSubtext: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  confirmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  confirmItemName: {
    ...typography.body,
    color: colors.text,
    flex: 2,
  },
  confirmItemQty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  confirmItemTotal: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
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
  fursCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.success + '40',
  },
  fursToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fursLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  fursInfo: {
    flex: 1,
  },
  fursTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  fursDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
