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
import { initiateSumUpPayment } from '@/services/sumup';
import type { InvoiceItem, Service, PaymentMethod } from '@/types';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

type Step = 'issue' | 'success';

export default function IssueInvoiceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clients, services, addInvoice, addClient } = useData();
  const { settings } = useSettings();
  const { showAlert } = useAlert();

  const [step, setStep] = useState<Step>('issue');
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [issuedInvoiceId, setIssuedInvoiceId] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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
    if (items.length === 0) {
      showAlert('Napaka', 'Dodajte vsaj eno postavko');
      return;
    }

    if (clientType === 'company' && (!clientName || !clientAddress || !clientCity || !clientPostalCode || !clientTaxNumber)) {
      showAlert('Napaka', 'Za pravno osebo izpolnite vse obvezne podatke');
      return;
    }

    let client = clients.find(c => c.name === clientName);
    if (!client) {
      await addClient({
        name: clientName || 'Fizična oseba',
        type: clientType,
        address: clientAddress || 'Neznano',
        city: clientCity || 'Neznano',
        postalCode: clientPostalCode || '0000',
        taxNumber: clientTaxNumber || undefined,
        email: clientEmail || undefined,
        phone: clientPhone || undefined,
      });
      const updatedClients = await import('@/services/storage').then(s => s.getClients());
      client = updatedClients.find(c => c.name === (clientName || 'Fizična oseba'))!;
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
      paymentMethod,
      subtotal: totals.subtotal,
      totalDDV: totals.totalDDV,
      total: totals.total,
      isPaid: paymentMethod === 'cash' || paymentMethod === 'card',
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

    const invoiceId = await addInvoice(newInvoice);
    setIssuedInvoiceId(invoiceId);

    // Če je izbrano kartično plačilo, izvedi SumUp transakcijo
    if (paymentMethod === 'card' && settings.sumup?.enabled) {
      try {
        setIsProcessingPayment(true);
        const sumupPayment = await initiateSumUpPayment(
          {
            apiKey: settings.sumup.apiKey,
            merchantCode: settings.sumup.merchantCode,
          },
          {
            amount: totals.total,
            currency: 'EUR',
            description: `Račun ${newInvoice.type === 'invoice' ? 'R' : 'P'}-${Date.now()}`,
            invoiceId,
          }
        );

        // Posodobi račun s SumUp podatki
        const invoices = await import('@/services/storage').then(s => s.getInvoices());
        const invoice = invoices.find(i => i.id === invoiceId);
        if (invoice) {
          await import('@/services/storage').then(s => 
            s.saveInvoices(
              invoices.map(i => 
                i.id === invoiceId 
                  ? { ...i, sumUpPayment: sumupPayment, isPaid: sumupPayment.status === 'SUCCESSFUL' }
                  : i
              )
            )
          );
        }

        if (sumupPayment.status !== 'SUCCESSFUL') {
          showAlert('Opozorilo', 'Plačilo ni bilo uspešno');
        }
      } catch (error) {
        showAlert('Napaka', 'Napaka pri procesiranju kartičnega plačila');
      } finally {
        setIsProcessingPayment(false);
      }
    }

    setStep('success');
  };

  const handlePrint = async () => {
    if (!settings.bluetoothPrinter) {
      showAlert('Tiskalnik ni nastavljen', 'Najprej povežite Bluetooth tiskalnik v nastavitvah', [
        { text: 'V redu' },
        { text: 'Odpri nastavitve', onPress: () => router.push('/settings') },
      ]);
      return;
    }

    const invoices = await import('@/services/storage').then(s => s.getInvoices());
    const invoice = invoices.find(i => i.id === issuedInvoiceId);
    
    if (!invoice) {
      showAlert('Napaka', 'Račun ni najden');
      return;
    }

    try {
      const { printReceiptBluetooth } = await import('@/services/bluetooth-printer');
      await printReceiptBluetooth(
        invoice,
        settings.company,
        settings.bluetoothPrinter,
        invoice.fursData
      );
      showAlert('Uspeh', 'Račun natisnjen na Bluetooth tiskalniku');
    } catch (error) {
      showAlert('Napaka', 'Napaka pri tiskanju. Preverite povezavo s tiskalnikom.');
    }
  };

  const handleNewInvoice = () => {
    setStep('issue');
    setClientType('individual');
    setClientName('');
    setClientAddress('');
    setClientCity('');
    setClientPostalCode('');
    setClientTaxNumber('');
    setClientEmail('');
    setClientPhone('');
    setItems([]);
    setEnableFurs(true);
    setPaymentMethod('cash');
    setIssuedInvoiceId('');
    setIsProcessingPayment(false);
  };

  const totals = calculateInvoiceTotals(items);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Test Mode Warning */}
      {settings.testMode && (
        <View style={styles.testModeWarning}>
          <MaterialIcons name="warning" size={20} color={colors.warning} />
          <Text style={styles.testModeText}>TESTNI NAČIN - Simulacija FURS</Text>
        </View>
      )}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Izdaja računa</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'issue' ? (
        <>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              {/* Client Type Selection */}
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

                {clientType === 'company' && (
                  <>
                    <Input
                      label="Ime stranke *"
                      value={clientName}
                      onChangeText={setClientName}
                      placeholder="Podjetje d.o.o."
                    />
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

              {/* Items */}
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

                <Text style={styles.addItemTitle}>Dodaj izdelke/storitve</Text>
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
                    <Text style={styles.totalFinal}>SKUPAJ:</Text>
                    <Text style={styles.totalFinalValue}>{formatCurrency(totals.total)}</Text>
                  </View>
                </Card>
              )}

              {/* Payment Method */}
              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Način plačila</Text>
                <View style={styles.paymentButtons}>
                  <Pressable
                    style={[
                      styles.paymentButton,
                      paymentMethod === 'cash' && styles.paymentButtonActive,
                    ]}
                    onPress={() => setPaymentMethod('cash')}
                  >
                    <MaterialIcons 
                      name="money" 
                      size={28} 
                      color={paymentMethod === 'cash' ? colors.text : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.paymentButtonText,
                      paymentMethod === 'cash' && styles.paymentButtonTextActive,
                    ]}>
                      Gotovina
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.paymentButton,
                      paymentMethod === 'card' && styles.paymentButtonActive,
                      !settings.sumup?.enabled && styles.paymentButtonDisabled,
                    ]}
                    onPress={() => {
                      if (!settings.sumup?.enabled) {
                        showAlert('SumUp ni nastavljen', 'Omogočite SumUp v nastavitvah');
                        return;
                      }
                      setPaymentMethod('card');
                    }}
                  >
                    <MaterialIcons 
                      name="credit-card" 
                      size={28} 
                      color={paymentMethod === 'card' ? colors.text : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.paymentButtonText,
                      paymentMethod === 'card' && styles.paymentButtonTextActive,
                    ]}>
                      Kartica
                    </Text>
                    {!settings.sumup?.enabled && (
                      <Text style={styles.disabledBadge}>Ni nastavljeno</Text>
                    )}
                  </Pressable>

                  <Pressable
                    style={[
                      styles.paymentButton,
                      paymentMethod === 'bank_transfer' && styles.paymentButtonActive,
                    ]}
                    onPress={() => setPaymentMethod('bank_transfer')}
                  >
                    <MaterialIcons 
                      name="account-balance" 
                      size={28} 
                      color={paymentMethod === 'bank_transfer' ? colors.text : colors.textSecondary} 
                    />
                    <Text style={[
                      styles.paymentButtonText,
                      paymentMethod === 'bank_transfer' && styles.paymentButtonTextActive,
                    ]}>
                      Prenos
                    </Text>
                  </Pressable>
                </View>
              </Card>

              {/* FURS Toggle */}
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
                      <Text style={styles.fursDesc}>
                        {settings.testMode ? 'SIMULACIJA - Račun bo potrjen v testnem načinu' : 'Račun bo fiskaliziran in pridobil ZOI, EOR oznake'}
                      </Text>
                    </View>
                  </View>
                  <MaterialIcons name="verified" size={24} color={enableFurs ? colors.success : colors.textMuted} />
                </Pressable>
              </Card>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Button
              title={enableFurs ? 'Izdaj in potrdi na FURS' : 'Izdaj račun'}
              onPress={handleIssue}
              size="medium"
              loading={isProcessingPayment}
              icon={<MaterialIcons name={enableFurs ? 'verified' : 'check-circle'} size={20} color={colors.text} />}
            />
          </View>
        </>
      ) : (
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <MaterialIcons name="check-circle" size={80} color={colors.success} />
            <Text style={styles.successTitle}>Račun uspešno izdan!</Text>
            <Text style={styles.successSubtitle}>
              {enableFurs 
                ? settings.testMode 
                  ? 'Račun je potrjen v testnem načinu (simulacija FURS)'
                  : 'Račun je davčno potrjen na FURS'
                : 'Račun je shranjen'
              }
            </Text>

            {enableFurs && (
              <View style={styles.fursInfo}>
                <Text style={styles.fursInfoTitle}>FURS potrditev:</Text>
                <Text style={styles.fursInfoText}>✓ ZOI oznaka pridobljena</Text>
                <Text style={styles.fursInfoText}>✓ EOR oznaka pridobljena</Text>
                <Text style={styles.fursInfoText}>✓ QR koda generirana</Text>
              </View>
            )}

            <View style={styles.successActions}>
              <Button
                title="Natisni račun"
                onPress={handlePrint}
                icon={<MaterialIcons name="print" size={20} color={colors.text} />}
              />
              <Button
                title="Nov račun"
                onPress={handleNewInvoice}
                variant="outline"
                icon={<MaterialIcons name="add" size={20} color={colors.primary} />}
              />
              <Button
                title="Nazaj na domov"
                onPress={() => router.back()}
                variant="outline"
                icon={<MaterialIcons name="home" size={20} color={colors.primary} />}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  testModeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '20',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.warning,
  },
  testModeText: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '700',
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
  addItemTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.md,
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
  },
  successTitle: {
    ...typography.h1,
    color: colors.success,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  fursInfoTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  fursInfoText: {
    ...typography.body,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successActions: {
    width: '100%',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  paymentButtons: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  paymentButton: {
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
  paymentButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  paymentButtonDisabled: {
    opacity: 0.5,
  },
  paymentButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  paymentButtonTextActive: {
    color: colors.text,
  },
  disabledBadge: {
    ...typography.bodySmall,
    color: colors.danger,
    fontSize: 10,
    marginLeft: spacing.sm,
  },
});
