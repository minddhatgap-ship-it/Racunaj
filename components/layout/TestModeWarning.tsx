import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSettings } from '@/hooks/useSettings';
import { colors, spacing, typography } from '@/constants/theme';

export function TestModeWarning() {
  const { settings } = useSettings();

  if (!settings.testMode) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MaterialIcons name="warning" size={20} color={colors.warning} />
      <Text style={styles.text}>TESTNI NAČIN - Simulacija FURS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warning + '20',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.warning,
  },
  text: {
    ...typography.body,
    color: colors.warning,
    fontWeight: '700',
  },
});
