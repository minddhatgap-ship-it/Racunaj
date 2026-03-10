import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useData } from '@/hooks/useData';
import { useAlert } from '@/template';
import { spacing, colors, typography, borderRadius } from '@/constants/theme';

export default function NewClientScreen() {
  const router = useRouter();
  const { addClient } = useData();
  const { showAlert } = useAlert();

  const [type, setType] = useState<'individual' | 'company'>('individual');
  const [name, setName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSave = async () => {
    if (!name || !address || !city || !postalCode) {
      showAlert('Napaka', 'Prosim izpolnite obvezna polja');
      return;
    }

    await addClient({
      name,
      type,
      taxNumber: taxNumber || undefined,
      address,
      postalCode,
      city,
      email: email || undefined,
      phone: phone || undefined,
    });

    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.form}>
          <Text style={styles.label}>Tip stranke</Text>
          <View style={styles.typeButtons}>
            <Pressable
              style={[styles.typeButton, type === 'individual' && styles.typeButtonActive]}
              onPress={() => setType('individual')}
            >
              <Text style={[styles.typeButtonText, type === 'individual' && styles.typeButtonTextActive]}>
                Fizična oseba
              </Text>
            </Pressable>
            <Pressable
              style={[styles.typeButton, type === 'company' && styles.typeButtonActive]}
              onPress={() => setType('company')}
            >
              <Text style={[styles.typeButtonText, type === 'company' && styles.typeButtonTextActive]}>
                Pravna oseba
              </Text>
            </Pressable>
          </View>

          <Input
            label="Ime stranke *"
            value={name}
            onChangeText={setName}
            placeholder={type === 'individual' ? 'Janez Novak' : 'Podjetje d.o.o.'}
          />
          <Input
            label="Davčna številka"
            value={taxNumber}
            onChangeText={setTaxNumber}
            placeholder="SI12345678"
          />
          <Input
            label="Naslov *"
            value={address}
            onChangeText={setAddress}
            placeholder="Ulica 123"
          />
          <View style={styles.row}>
            <Input
              label="Poštna št. *"
              value={postalCode}
              onChangeText={setPostalCode}
              placeholder="1000"
              keyboardType="numeric"
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
            label="E-pošta"
            value={email}
            onChangeText={setEmail}
            placeholder="info@podjetje.si"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Telefon"
            value={phone}
            onChangeText={setPhone}
            placeholder="+386 1 234 5678"
            keyboardType="phone-pad"
          />

          <Button title="Shrani stranko" onPress={handleSave} size="large" />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: spacing.md,
  },
  label: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
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
});
