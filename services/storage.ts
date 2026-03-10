import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Client, Service, Invoice } from '@/types';

const KEYS = {
  CLIENTS: '@clients',
  SERVICES: '@services',
  INVOICES: '@invoices',
  INVOICE_COUNTER: '@invoice_counter',
};

// Clients
export async function saveClients(clients: Client[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
}

export async function getClients(): Promise<Client[]> {
  const data = await AsyncStorage.getItem(KEYS.CLIENTS);
  return data ? JSON.parse(data) : [];
}

// Services
export async function saveServices(services: Service[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
}

export async function getServices(): Promise<Service[]> {
  const data = await AsyncStorage.getItem(KEYS.SERVICES);
  return data ? JSON.parse(data) : [];
}

// Invoices
export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
}

export async function getInvoices(): Promise<Invoice[]> {
  const data = await AsyncStorage.getItem(KEYS.INVOICES);
  return data ? JSON.parse(data) : [];
}

// Invoice counter
export async function getNextInvoiceNumber(): Promise<string> {
  const counterStr = await AsyncStorage.getItem(KEYS.INVOICE_COUNTER);
  const counter = counterStr ? parseInt(counterStr, 10) : 0;
  const nextCounter = counter + 1;
  await AsyncStorage.setItem(KEYS.INVOICE_COUNTER, nextCounter.toString());
  
  const year = new Date().getFullYear();
  return `R${year}-${nextCounter.toString().padStart(4, '0')}`;
}
