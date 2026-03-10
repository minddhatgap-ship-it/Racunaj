import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardCard } from '@/components/feature/DashboardCard';
import { Button } from '@/components/ui/Button';
import { useData } from '@/hooks/useData';
import { useAlert } from '@/template';
import { TestModeWarning } from '@/components';
import { getDashboardStats, formatCurrency } from '@/services/calculations';
import { exportToFursXML, exportToCSV, exportToJSON } from '@/services/export';
import { useSettings } from '@/hooks/useSettings';
import { colors, spacing, typography } from '@/constants/theme';

export default function BusinessOverviewScreen() {
  const router = useRouter();
  const { invoices } = useData();
  const { settings } = useSettings();
  const { showAlert } = useAlert();
  const stats = getDashboardStats(invoices);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportXML = async () => {
    try {
      setIsExporting(true);
      const now = Date.now();
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime();
      
      await exportToFursXML(invoices, settings.company, {
        from: firstDayOfMonth,
        to: lastDayOfMonth,
      });
      
      showAlert('Uspeh', 'XML datoteka za FURS uspešno izvožena');
    } catch (error) {
      showAlert('Napaka', 'Napaka pri izvozu XML datoteke');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const now = Date.now();
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
      const lastDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime();
      
      await exportToCSV(invoices, {
        from: firstDayOfMonth,
        to: lastDayOfMonth,
      });
      
      showAlert('Uspeh', 'CSV datoteka uspešno izvožena');
    } catch (error) {
      showAlert('Napaka', 'Napaka pri izvozu CSV datoteke');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const now = Date.now();
      const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
      const lastDayOfYear = new Date(new Date().getFullYear(), 11, 31).getTime();
      
      await exportToJSON(invoices, {
        from: firstDayOfYear,
        to: lastDayOfYear,
      });
      
      showAlert('Uspeh', 'JSON backup uspešno izvožen');
    } catch (error) {
      showAlert('Napaka', 'Napaka pri izvozu JSON datoteke');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TestModeWarning />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Pregled poslovanja</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Statistika</Text>
          
          <DashboardCard
            title="Mesečni prihodki"
            value={formatCurrency(stats.monthlyRevenue)}
            icon="trending-up"
            color={colors.success}
            subtitle="Tekoči mesec"
          />
          
          <DashboardCard
            title="Skupni prihodki"
            value={formatCurrency(stats.totalRevenue)}
            icon="account-balance-wallet"
            color={colors.primary}
            subtitle={`${stats.totalInvoices} računov`}
          />

          <DashboardCard
            title="Neplačani računi"
            value={formatCurrency(stats.unpaidAmount)}
            icon="access-time"
            color={colors.warning}
            subtitle={`${stats.unpaidInvoices} odprtih`}
          />

          <DashboardCard
            title="Skupni DDV"
            value={formatCurrency(stats.totalDDV)}
            icon="receipt"
            color={colors.secondary}
            subtitle="Za poročanje"
          />

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Izvozi</Text>

          <Button
            title="Izvozi XML za FURS eDavki"
            onPress={handleExportXML}
            loading={isExporting}
            icon={<MaterialIcons name="cloud-upload" size={20} color={colors.text} />}
          />

          <Button
            title="Izvozi CSV za Excel"
            onPress={handleExportCSV}
            loading={isExporting}
            variant="outline"
            icon={<MaterialIcons name="table-chart" size={20} color={colors.primary} />}
          />

          <Button
            title="Izvozi JSON Backup"
            onPress={handleExportJSON}
            loading={isExporting}
            variant="outline"
            icon={<MaterialIcons name="backup" size={20} color={colors.primary} />}
          />
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
  sectionTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
  },
});
