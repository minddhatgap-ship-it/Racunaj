import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/hooks/useSettings';
import { useAlert } from '@/template';
import type { TaxSystem, BluetoothPrinter } from '@/types';
import { scanBluetoothPrinters, connectPrinter, printTestReceipt } from '@/services/bluetooth-printer';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

const TAX_SYSTEMS: { value: TaxSystem; label: string; description: string }[] = [
  { value: 'ddv', label: 'Davek na dodano vrednost (DDV)', description: 'Standardni sistem z 22% DDV' },
  { value: 'normiranci', label: 'Normirani stroški', description: 'Poenostavljen sistem za s.p.' },
  { value: 'pavsal', label: 'Pavšalni sistem', description: 'Pavšalno odmerjeni dohodek' },
  { value: 'oproščen', label: 'Oproščen DDV', description: 'Brez obračuna DDV' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateCompany, updateTheme, updateTestMode, updateSumUp, updateFurs, updateBluetoothPrinter } = useSettings();
  const { showAlert } = useAlert();
  const [isScanning, setIsScanning] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<BluetoothPrinter[]>([]);

  const [name, setName] = useState(settings.company.name);
  const [owner, setOwner] = useState(settings.company.owner);
  const [address, setAddress] = useState(settings.company.address);
  const [city, setCity] = useState(settings.company.city);
  const [postalCode, setPostalCode] = useState(settings.company.postalCode);
  const [taxNumber, setTaxNumber] = useState(settings.company.taxNumber);
  const [taxSystem, setTaxSystem] = useState(settings.company.taxSystem);
  const [iban, setIban] = useState(settings.company.iban || '');
  const [phone, setPhone] = useState(settings.company.phone || '');
  const [email, setEmail] = useState(settings.company.email || '');

  // SumUp nastavitve
  const [sumupEnabled, setSumupEnabled] = useState(settings.sumup?.enabled || false);
  const [sumupApiKey, setSumupApiKey] = useState(settings.sumup?.apiKey || '');
  const [sumupMerchantCode, setSumupMerchantCode] = useState(settings.sumup?.merchantCode || '');

  // FURS nastavitve
  const [fursCertPassword, setFursCertPassword] = useState(settings.furs?.certPassword || '');
  const [fursTaxNumber, setFursTaxNumber] = useState(settings.furs?.taxNumber || taxNumber);

  const handleScanPrinters = async () => {
    try {
      setIsScanning(true);
      const printers = await scanBluetoothPrinters();
      setAvailablePrinters(printers);
      
      if (printers.length === 0) {
        showAlert('Ni naprav', 'Ni najdenih Bluetooth tiskalnikov. Preverite ali je tiskalnik vklopljen.');
      } else {
        showAlert('Najdeno', `Najdenih ${printers.length} tiskalnikov`);
      }
    } catch (error) {
      showAlert('Napaka', 'Napaka pri iskanju Bluetooth naprav');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectPrinter = async (printer: BluetoothPrinter) => {
    try {
      await connectPrinter(printer.address);
      await updateBluetoothPrinter({
        ...printer,
        connected: true,
      });
      showAlert('Povezano', `Tiskalnik ${printer.name} povezan`);
    } catch (error) {
      showAlert('Napaka', 'Napaka pri povezovanju s tiskalnikom');
    }
  };

  const handleTestPrint = async () => {
    if (!settings.bluetoothPrinter) {
      showAlert('Napaka', 'Najprej izberite tiskalnik');
      return;
    }

    try {
      await printTestReceipt(settings.bluetoothPrinter);
      showAlert('Uspeh', 'Testno tiskanje uspešno');
    } catch (error) {
      showAlert('Napaka', 'Napaka pri testnem tiskanju');
    }
  };

  const handleDisconnectPrinter = async () => {
    await updateBluetoothPrinter(undefined);
    showAlert('Odklopljeno', 'Tiskalnik odklopljen');
  };

  const handleSave = async () => {
    await updateCompany({
      name,
      owner,
      address,
      city,
      postalCode,
      taxNumber,
      taxSystem,
      iban: iban || undefined,
      phone: phone || undefined,
      email: email || undefined,
    });

    await updateSumUp({
      enabled: sumupEnabled,
      apiKey: sumupApiKey,
      merchantCode: sumupMerchantCode,
    });

    await updateFurs({
      certPassword: fursCertPassword || undefined,
      taxNumber: fursTaxNumber,
    });

    showAlert('Uspeh', 'Nastavitve shranjene');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nastavitve</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Company Info */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Podatki podjetja</Text>
            <Input
              label="Naziv podjetja *"
              value={name}
              onChangeText={setName}
              placeholder="Moje Podjetje s.p."
            />
            <Input
              label="Lastnik/direktor *"
              value={owner}
              onChangeText={setOwner}
              placeholder="Janez Novak"
            />
            <Input
              label="Naslov *"
              value={address}
              onChangeText={setAddress}
              placeholder="Slovenska cesta 1"
            />
            <View style={styles.row}>
              <Input
                label="Poštna št. *"
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="1000"
                style={styles.halfInput}
              />
              <Input
                label="Mesto *"
                value={city}
                onChangeText={setCity}
                placeholder="Ljubljana"
                style={styles.halfInput}
              />
            </View>
            <Input
              label="Davčna številka *"
              value={taxNumber}
              onChangeText={setTaxNumber}
              placeholder="SI12345678"
            />
            <Input
              label="IBAN"
              value={iban}
              onChangeText={setIban}
              placeholder="SI56 0110 0600 0123 456"
            />
            <Input
              label="Telefon"
              value={phone}
              onChangeText={setPhone}
              placeholder="+386 1 234 5678"
              keyboardType="phone-pad"
            />
            <Input
              label="E-pošta"
              value={email}
              onChangeText={setEmail}
              placeholder="info@podjetje.si"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Card>

          {/* Tax System */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Davčni sistem</Text>
            {TAX_SYSTEMS.map(system => (
              <Pressable
                key={system.value}
                style={[
                  styles.taxButton,
                  taxSystem === system.value && styles.taxButtonActive,
                ]}
                onPress={() => setTaxSystem(system.value)}
              >
                <View style={styles.taxButtonContent}>
                  <Text
                    style={[
                      styles.taxButtonTitle,
                      taxSystem === system.value && styles.taxButtonTitleActive,
                    ]}
                  >
                    {system.label}
                  </Text>
                  <Text
                    style={[
                      styles.taxButtonDesc,
                      taxSystem === system.value && styles.taxButtonDescActive,
                    ]}
                  >
                    {system.description}
                  </Text>
                </View>
                {taxSystem === system.value && (
                  <MaterialIcons name="check-circle" size={24} color={colors.text} />
                )}
              </Pressable>
            ))}
          </Card>

          {/* FURS Certificate */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="verified-user" size={24} color={colors.success} />
              <Text style={styles.sectionTitle}>FURS Certifikat</Text>
            </View>
            <Text style={styles.infoText}>
              Za davčno potrjevanje računov potrebujete digitalni certifikat (P12) iz FURS portala.
            </Text>
            <Input
              label="Davčna številka za FURS"
              value={fursTaxNumber}
              onChangeText={setFursTaxNumber}
              placeholder="SI12345678"
            />
            <Input
              label="Geslo certifikata"
              value={fursCertPassword}
              onChangeText={setFursCertPassword}
              placeholder="••••••••"
              secureTextEntry
            />
            <View style={styles.infoBox}>
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <Text style={styles.infoBoxText}>
                Certifikat (P12) prenesite iz FURS portala eDavki. V produkcijski verziji aplikacije ga boste lahko naložili preko nastavitev.
              </Text>
            </View>
          </Card>

          {/* SumUp Payment */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="credit-card" size={24} color={colors.secondary} />
              <Text style={styles.sectionTitle}>SumUp kartična plačila</Text>
            </View>
            <Pressable
              style={[
                styles.toggleButton,
                sumupEnabled && styles.toggleButtonActive,
              ]}
              onPress={() => setSumupEnabled(!sumupEnabled)}
            >
              <View style={styles.toggleContent}>
                <MaterialIcons 
                  name={sumupEnabled ? 'check-box' : 'check-box-outline-blank'} 
                  size={24} 
                  color={sumupEnabled ? colors.success : colors.textMuted} 
                />
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleTitle, sumupEnabled && styles.toggleTitleActive]}>
                    Omogoči SumUp plačila
                  </Text>
                  <Text style={styles.toggleDesc}>
                    Sprejemajte kartična plačila preko SumUp terminala
                  </Text>
                </View>
              </View>
            </Pressable>

            {sumupEnabled && (
              <>
                <Input
                  label="SumUp API ključ"
                  value={sumupApiKey}
                  onChangeText={setSumupApiKey}
                  placeholder="sup_sk_••••••••••••••••"
                  secureTextEntry
                />
                <Input
                  label="Merchant Code"
                  value={sumupMerchantCode}
                  onChangeText={setSumupMerchantCode}
                  placeholder="MXXXXXXXXX"
                />
                <View style={styles.infoBox}>
                  <MaterialIcons name="info" size={20} color={colors.primary} />
                  <Text style={styles.infoBoxText}>
                    API ključ pridobite v SumUp Developer Portal (developer.sumup.com). Potrebujete aktiven SumUp trgovski račun.
                  </Text>
                </View>
              </>
            )}
          </Card>

          {/* Test Mode */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Testni način</Text>
            <Pressable
              style={[
                styles.testModeButton,
                settings.testMode && styles.testModeButtonActive,
              ]}
              onPress={() => updateTestMode(!settings.testMode)}
            >
              <View style={styles.testModeContent}>
                <MaterialIcons 
                  name={settings.testMode ? 'check-box' : 'check-box-outline-blank'} 
                  size={24} 
                  color={settings.testMode ? colors.warning : colors.textMuted} 
                />
                <View style={styles.testModeInfo}>
                  <Text style={[styles.testModeTitle, settings.testMode && styles.testModeTitleActive]}>
                    Simulacija FURS
                  </Text>
                  <Text style={styles.testModeDesc}>
                    {settings.testMode 
                      ? 'AKTIVNO - Računi se ne pošiljajo na FURS' 
                      : 'NEAKTIVNO - Računi se pošiljajo na FURS'}
                  </Text>
                </View>
              </View>
              {settings.testMode && (
                <MaterialIcons name="warning" size={24} color={colors.warning} />
              )}
            </Pressable>
          </Card>

          {/* Bluetooth Printer */}
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="bluetooth" size={24} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Bluetooth tiskalnik (POS 58mm)</Text>
            </View>

            {settings.bluetoothPrinter ? (
              <>
                <View style={styles.printerConnected}>
                  <View style={styles.printerInfo}>
                    <MaterialIcons name="print" size={32} color={colors.success} />
                    <View style={styles.printerDetails}>
                      <Text style={styles.printerName}>{settings.bluetoothPrinter.name}</Text>
                      <Text style={styles.printerAddress}>{settings.bluetoothPrinter.address}</Text>
                      <View style={styles.connectedBadge}>
                        <MaterialIcons name="check-circle" size={14} color={colors.success} />
                        <Text style={styles.connectedText}>Povezano</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.printerActions}>
                    <Button
                      title="Testno tiskanje"
                      onPress={handleTestPrint}
                      size="small"
                      icon={<MaterialIcons name="print" size={18} color={colors.text} />}
                    />
                    <Button
                      title="Odklopi"
                      onPress={handleDisconnectPrinter}
                      variant="outline"
                      size="small"
                      icon={<MaterialIcons name="bluetooth-disabled" size={18} color={colors.danger} />}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.infoText}>
                  Povežite Bluetooth POS tiskalnik (58mm širina) za tiskanje računov.
                </Text>
                <Button
                  title="Poišči tiskalnike"
                  onPress={handleScanPrinters}
                  loading={isScanning}
                  icon={<MaterialIcons name="search" size={20} color={colors.text} />}
                />

                {availablePrinters.length > 0 && (
                  <View style={styles.printersList}>
                    <Text style={styles.printersTitle}>Najdeni tiskalniki:</Text>
                    {availablePrinters.map(printer => (
                      <Pressable
                        key={printer.id}
                        style={styles.printerItem}
                        onPress={() => handleSelectPrinter(printer)}
                      >
                        <MaterialIcons name="print" size={24} color={colors.textSecondary} />
                        <View style={styles.printerItemInfo}>
                          <Text style={styles.printerItemName}>{printer.name}</Text>
                          <Text style={styles.printerItemAddress}>{printer.address}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
                      </Pressable>
                    ))}
                  </View>
                )}

                <View style={styles.infoBox}>
                  <MaterialIcons name="info" size={20} color={colors.primary} />
                  <Text style={styles.infoBoxText}>
                    Podprti tiskalniki: 58mm termični POS tiskalniki z ESC/POS protokolom (npr. Xprinter, Goojprt, Sunmi).
                  </Text>
                </View>
              </>
            )}
          </Card>

          {/* Theme */}
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Tema</Text>
            <View style={styles.themeButtons}>
              <Pressable
                style={[
                  styles.themeButton,
                  settings.theme === 'light' && styles.themeButtonActive,
                ]}
                onPress={() => updateTheme('light')}
              >
                <MaterialIcons name="light-mode" size={24} color={colors.text} />
                <Text style={styles.themeButtonText}>Svetla</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.themeButton,
                  settings.theme === 'dark' && styles.themeButtonActive,
                ]}
                onPress={() => updateTheme('dark')}
              >
                <MaterialIcons name="dark-mode" size={24} color={colors.text} />
                <Text style={styles.themeButtonText}>Temna</Text>
              </Pressable>
            </View>
          </Card>

          <Button title="Shrani nastavitve" onPress={handleSave} size="large" />
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
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  taxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  taxButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  taxButtonContent: {
    flex: 1,
  },
  taxButtonTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  taxButtonTitleActive: {
    color: colors.text,
  },
  taxButtonDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  taxButtonDescActive: {
    color: colors.textSecondary,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  infoBoxText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  toggleTitleActive: {
    color: colors.success,
  },
  toggleDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  themeButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  themeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  themeButtonText: {
    ...typography.body,
    color: colors.text,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  testModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  testModeButtonActive: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
  },
  testModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  testModeInfo: {
    flex: 1,
  },
  testModeTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  testModeTitleActive: {
    color: colors.warning,
  },
  testModeDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  printerConnected: {
    gap: spacing.md,
  },
  printerInfo: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.success,
  },
  printerDetails: {
    flex: 1,
  },
  printerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  printerAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  connectedText: {
    ...typography.bodySmall,
    color: colors.success,
    fontWeight: '600',
  },
  printerActions: {
    gap: spacing.sm,
  },
  printersList: {
    marginTop: spacing.md,
  },
  printersTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  printerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  printerItemInfo: {
    flex: 1,
  },
  printerItemName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  printerItemAddress: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
