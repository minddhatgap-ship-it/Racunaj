import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, TaxSystem } from '@/types';

interface SettingsContextType {
  settings: AppSettings;
  updateCompany: (company: Partial<AppSettings['company']>) => Promise<void>;
  updateTheme: (theme: 'light' | 'dark') => Promise<void>;
  updateTestMode: (testMode: boolean) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  testMode: false,
  company: {
    name: 'Moje Podjetje s.p.',
    owner: 'Janez Novak',
    address: 'Slovenska cesta 1',
    city: 'Ljubljana',
    postalCode: '1000',
    taxNumber: 'SI12345678',
    taxSystem: 'ddv' as TaxSystem,
  },
};

const SETTINGS_KEY = '@app_settings';

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setIsLoading(true);
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        setSettings(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateCompany(companyData: Partial<AppSettings['company']>) {
    const updated = {
      ...settings,
      company: { ...settings.company, ...companyData },
    };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }

  async function updateTheme(theme: 'light' | 'dark') {
    const updated = { ...settings, theme };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }

  async function updateTestMode(testMode: boolean) {
    const updated = { ...settings, testMode };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateCompany, updateTheme, updateTestMode, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}
