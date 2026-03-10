import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertProvider } from '@/template';
import { DataProvider } from '@/contexts/DataContext';
import { SettingsProvider } from '@/contexts/SettingsContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <SettingsProvider>
          <DataProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="issue-invoice" />
              <Stack.Screen name="invoices" />
              <Stack.Screen name="business-overview" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="manage-services" />
              <Stack.Screen name="invoice/[id]" options={{ headerShown: true, title: 'Račun' }} />
              <Stack.Screen name="new-service" options={{ headerShown: true, title: 'Nova storitev', presentation: 'modal' }} />
            </Stack>
          </DataProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
