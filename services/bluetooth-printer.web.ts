/**
 * Bluetooth POS Printer Service - Web Fallback
 * Web platforma ne podpira Bluetooth ESC/POS tiskalnikov
 */

import type { Invoice, CompanySettings, BluetoothPrinter } from '@/types';
import type { FursData } from './furs';

export function generateReceiptCommands(
  invoice: Invoice,
  company: CompanySettings,
  fursData?: FursData
): string {
  console.warn('Bluetooth printing is not supported on web platform');
  return '';
}

export async function initBluetooth(): Promise<void> {
  throw new Error('Bluetooth tiskanje ni podprto na web platformi. Uporabite mobilno aplikacijo (iOS/Android).');
}

export async function scanBluetoothPrinters(): Promise<BluetoothPrinter[]> {
  throw new Error('Bluetooth tiskanje ni podprto na web platformi. Uporabite mobilno aplikacijo (iOS/Android).');
}

export async function connectPrinter(address: string): Promise<void> {
  throw new Error('Bluetooth tiskanje ni podprto na web platformi. Uporabite mobilno aplikacijo (iOS/Android).');
}

export async function disconnectPrinter(): Promise<void> {
  console.warn('Bluetooth printing is not supported on web platform');
}

export async function printReceiptBluetooth(
  invoice: Invoice,
  company: CompanySettings,
  printer: BluetoothPrinter,
  fursData?: FursData
): Promise<void> {
  throw new Error('Bluetooth tiskanje ni podprto na web platformi. Uporabite mobilno aplikacijo (iOS/Android) ali izvozite PDF.');
}

export async function printTestReceipt(printer: BluetoothPrinter): Promise<void> {
  throw new Error('Bluetooth tiskanje ni podprto na web platformi. Uporabite mobilno aplikacijo (iOS/Android).');
}
