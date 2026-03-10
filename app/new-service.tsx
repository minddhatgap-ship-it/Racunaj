import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useData } from '@/hooks/useData';
import { useAlert } from '@/template';
import { DDV_RATES } from '@/constants/config';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function NewServiceScreen() {
  const router = useRouter();
  const { addService } = useData();
  const { showAlert } = useAlert();

  const [category, setCategory] = useState<'service' | 'product'>('service');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('ur');
  const [ddvRate, setDdvRate] = useState(DDV_RATES.STANDARD);

  const handleSave = async () => {
    if (!name || !price) {
      showAlert('Napaka', 'Prosim izpolnite obvezna polja');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showAlert('Napaka', 'Cena mora biti večja od 0');
      return;
    }

    await addService({
      name,
      category,
      description: description || undefined,
      price: priceNum,
      unit,
      ddvRate,
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
          <Text style={styles.label}>Kategorija</Text>
          <View style={styles.categoryButtons}>
            <Pressable
              style={[styles.categoryButton, category === 'service' && styles.categoryButtonActive]}
              onPress={() => {
                setCategory('service');
                setUnit('ur');
              }}
            >
              <Text style={[styles.categoryButtonText, category === 'service' && styles.categoryButtonTextActive]}>
                Storitev
              </Text>
            </Pressable>
            <Pressable
              style={[styles.categoryButton, category === 'product' && styles.categoryButtonActive]}
              onPress={() => {
                setCategory('product');
                setUnit('kos');
              }}
            >
              <Text style={[styles.categoryButtonText, category === 'product' && styles.categoryButtonTextActive]}>
                Izdelek
              </Text>
            </Pressable>
          </View>

          <Input
            label="Naziv storitve/izdelka *"
            value={name}
            onChangeText={setName}
            placeholder={category === 'service' ? 'Svetovanje' : 'Izdelek XY'}
          />
          <Input
            label="Opis"
            value={description}
            onChangeText={setDescription}
            placeholder="Kratki opis storitve"
            multiline
            numberOfLines={3}
          />
          <Input
            label="Cena (brez DDV) *"
            value={price}
            onChangeText={setPrice}
            placeholder="50.00"
            keyboardType="decimal-pad"
          />
          <Input
            label="Enota mere"
            value={unit}
            onChangeText={setUnit}
            placeholder="ur, kos, m2..."
          />

          <Text style={styles.label}>DDV stopnja</Text>
          <View style={styles.ddvButtons}>
            <Pressable
              style={[styles.ddvButton, ddvRate === DDV_RATES.STANDARD && styles.ddvButtonActive]}
              onPress={() => setDdvRate(DDV_RATES.STANDARD)}
            >
              <Text style={[styles.ddvButtonText, ddvRate === DDV_RATES.STANDARD && styles.ddvButtonTextActive]}>
                22%
              </Text>
            </Pressable>
            <Pressable
              style={[styles.ddvButton, ddvRate === DDV_RATES.REDUCED && styles.ddvButtonActive]}
              onPress={() => setDdvRate(DDV_RATES.REDUCED)}
            >
              <Text style={[styles.ddvButtonText, ddvRate === DDV_RATES.REDUCED && styles.ddvButtonTextActive]}>
                9.5%
              </Text>
            </Pressable>
            <Pressable
              style={[styles.ddvButton, ddvRate === DDV_RATES.NONE && styles.ddvButtonActive]}
              onPress={() => setDdvRate(DDV_RATES.NONE)}
            >
              <Text style={[styles.ddvButtonText, ddvRate === DDV_RATES.NONE && styles.ddvButtonTextActive]}>
                0%
              </Text>
            </Pressable>
          </View>

          <Button 
            title="Shrani storitev" 
            onPress={handleSave} 
            size="large"
            icon={<MaterialIcons name="check-circle" size={24} color={colors.text} />}
          />
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
  categoryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: colors.text,
  },
  ddvButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ddvButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  ddvButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ddvButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ddvButtonTextActive: {
    color: colors.text,
  },
});
