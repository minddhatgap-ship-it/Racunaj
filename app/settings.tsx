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
import type { TaxSystem } from '@/types';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

const TAX_SYSTEMS: { value: TaxSystem; label: string; description: string }[] = [
  { value: 'ddv', label: 'Davek na dodano vrednost (DDV)', description: 'Standardni sistem z 22% DDV' },
  { value: 'normiranci', label: 'Normirani stroški', description: 'Poenostavljen sistem za s.p.' },
  { value: 'pavsal', label: 'Pavšalni sistem', description: 'Pavšalno odmerjeni dohodek' },
  { value: 'oproščen', label: 'Oproščen DDV', description: 'Brez obračuna DDV' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateCompany, updateTheme, updateTestMode } = useSettings();
  const { showAlert } = useAlert();

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
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
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
});
