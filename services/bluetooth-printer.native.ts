/**
 * Bluetooth POS Printer Service - Native (iOS/Android)
 * Podpora za 58mm termične tiskalnike z ESC/POS komandami
 */

import type { Invoice, CompanySettings, BluetoothPrinter } from '@/types';
import { formatCurrency, formatDate } from './calculations';
import type { FursData } from './furs';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * ESC/POS konstante za 58mm papir
 */
const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
  INIT: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  SIZE_NORMAL: `${GS}!\x00`,
  SIZE_DOUBLE: `${GS}!\x11`,
  SIZE_LARGE: `${GS}!\x22`,
  UNDERLINE_ON: `${ESC}-\x01`,
  UNDERLINE_OFF: `${ESC}-\x00`,
  CUT_PAPER: `${GS}V\x00`,
  FEED_LINE: '\n',
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,
};

const LINE_WIDTH = 32;

function centerText(text: string): string {
  if (text.length >= LINE_WIDTH) return text;
  const padding = Math.floor((LINE_WIDTH - text.length) / 2);
  return ' '.repeat(padding) + text;
}

function rightAlign(text: string, width: number = LINE_WIDTH): string {
  if (text.length >= width) return text;
  return ' '.repeat(width - text.length) + text;
}

function twoColumn(left: string, right: string): string {
  const available = LINE_WIDTH - right.length;
  const leftTrimmed = left.substring(0, available - 1);
  return leftTrimmed + ' '.repeat(available - leftTrimmed.length) + right;
}

function separator(char: string = '-'): string {
  return char.repeat(LINE_WIDTH);
}

function wrapText(text: string, maxWidth: number = LINE_WIDTH): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + word).length <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generateReceiptCommands(
  invoice: Invoice,
  company: CompanySettings,
  fursData?: FursData
): string {
  let commands = '';
  commands += CMD.INIT;
  commands += CMD.ALIGN_CENTER;
  commands += CMD.SIZE_DOUBLE;
  commands += CMD.BOLD_ON;
  commands += company.name + CMD.FEED_LINE;
  commands += CMD.BOLD_OFF;
  commands += CMD.SIZE_NORMAL;
  commands += company.owner + CMD.FEED_LINE;
  commands += company.address + CMD.FEED_LINE;
  commands += `${company.postalCode} ${company.city}` + CMD.FEED_LINE;
  commands += `Davcna st.: ${company.taxNumber}` + CMD.FEED_LINE;
  if (company.phone) commands += company.phone + CMD.FEED_LINE;
  commands += separator('=') + CMD.FEED_LINE;

  commands += CMD.SIZE_LARGE;
  commands += CMD.BOLD_ON;
  const docType = getDocumentType(invoice.type);
  commands += centerText(docType) + CMD.FEED_LINE;
  commands += CMD.SIZE_NORMAL;
  commands += centerText(invoice.invoiceNumber) + CMD.FEED_LINE;
  commands += CMD.BOLD_OFF;
  commands += separator('=') + CMD.FEED_LINE;

  commands += CMD.ALIGN_LEFT;
  commands += twoColumn('Datum:', formatDate(invoice.issueDate)) + CMD.FEED_LINE;
  if (invoice.type === 'invoice') {
    commands += twoColumn('Rok placila:', formatDate(invoice.dueDate)) + CMD.FEED_LINE;
  }
  commands += twoColumn('Nacin placila:', getPaymentMethodText(invoice.paymentMethod)) + CMD.FEED_LINE;
  commands += separator() + CMD.FEED_LINE;

  if (invoice.clientData.type === 'company') {
    commands += CMD.BOLD_ON + 'STRANKA:' + CMD.BOLD_OFF + CMD.FEED_LINE;
    commands += invoice.clientData.name + CMD.FEED_LINE;
    commands += invoice.clientData.address + CMD.FEED_LINE;
    commands += `${invoice.clientData.postalCode} ${invoice.clientData.city}` + CMD.FEED_LINE;
    if (invoice.clientData.taxNumber) {
      commands += `Davcna st.: ${invoice.clientData.taxNumber}` + CMD.FEED_LINE;
    }
    commands += separator() + CMD.FEED_LINE;
  } else {
    commands += twoColumn('Stranka:', 'Fizicna oseba') + CMD.FEED_LINE;
    commands += separator() + CMD.FEED_LINE;
  }

  commands += CMD.BOLD_ON + 'POSTAVKE' + CMD.BOLD_OFF + CMD.FEED_LINE;
  commands += separator() + CMD.FEED_LINE;

  invoice.items.forEach((item, index) => {
    commands += CMD.BOLD_ON + `${index + 1}. ${item.serviceName}` + CMD.BOLD_OFF + CMD.FEED_LINE;
    
    if (item.description) {
      const descLines = wrapText(item.description, LINE_WIDTH - 2);
      descLines.forEach(line => {
        commands += `  ${line}` + CMD.FEED_LINE;
      });
    }
    
    commands += `  ${item.quantity} ${item.unit} x ${formatCurrency(item.pricePerUnit)}` + CMD.FEED_LINE;
    commands += twoColumn(`  Osnova (${item.ddvRate}% DDV):`, formatCurrency(item.totalWithoutDDV)) + CMD.FEED_LINE;
    commands += CMD.BOLD_ON;
    commands += twoColumn('  SKUPAJ:', formatCurrency(item.totalWithDDV)) + CMD.FEED_LINE;
    commands += CMD.BOLD_OFF;
    commands += CMD.FEED_LINE;
  });

  commands += separator('=') + CMD.FEED_LINE;
  commands += twoColumn('Skupaj brez DDV:', formatCurrency(invoice.subtotal)) + CMD.FEED_LINE;
  commands += twoColumn(`DDV (22%):`, formatCurrency(invoice.totalDDV)) + CMD.FEED_LINE;
  commands += separator() + CMD.FEED_LINE;
  commands += CMD.SIZE_DOUBLE;
  commands += CMD.BOLD_ON;
  commands += twoColumn('SKUPAJ:', formatCurrency(invoice.total)) + CMD.FEED_LINE;
  commands += CMD.BOLD_OFF;
  commands += CMD.SIZE_NORMAL;
  commands += separator('=') + CMD.FEED_LINE;

  if (fursData) {
    commands += CMD.FEED_LINE;
    commands += CMD.ALIGN_CENTER;
    commands += CMD.BOLD_ON + 'FURS POTRJEN RACUN' + CMD.BOLD_OFF + CMD.FEED_LINE;
    commands += separator() + CMD.FEED_LINE;
    commands += CMD.ALIGN_LEFT;
    commands += CMD.BOLD_ON + 'ZOI:' + CMD.BOLD_OFF + CMD.FEED_LINE;
    
    const zoiLines = fursData.zoi.match(/.{1,32}/g) || [fursData.zoi];
    zoiLines.forEach(line => {
      commands += line + CMD.FEED_LINE;
    });
    
    commands += CMD.FEED_LINE;
    commands += CMD.BOLD_ON + 'EOR:' + CMD.BOLD_OFF + CMD.FEED_LINE;
    
    const eorLines = fursData.eor.match(/.{1,32}/g) || [fursData.eor];
    eorLines.forEach(line => {
      commands += line + CMD.FEED_LINE;
    });
    
    commands += CMD.FEED_LINE;
    commands += CMD.ALIGN_CENTER;
    commands += 'Preverjanje:' + CMD.FEED_LINE;
    commands += 'blagajne.fu.gov.si' + CMD.FEED_LINE;
    commands += separator() + CMD.FEED_LINE;
  }

  if (invoice.notes) {
    commands += CMD.FEED_LINE;
    commands += CMD.ALIGN_LEFT;
    commands += CMD.BOLD_ON + 'OPOMBE:' + CMD.BOLD_OFF + CMD.FEED_LINE;
    const noteLines = wrapText(invoice.notes, LINE_WIDTH);
    noteLines.forEach(line => {
      commands += line + CMD.FEED_LINE;
    });
    commands += separator() + CMD.FEED_LINE;
  }

  commands += CMD.FEED_LINE;
  commands += CMD.ALIGN_CENTER;
  commands += 'Hvala za poslovanje!' + CMD.FEED_LINE;
  if (company.email) commands += company.email + CMD.FEED_LINE;
  if (company.website) commands += company.website + CMD.FEED_LINE;
  
  commands += CMD.FEED_LINES(3);
  commands += CMD.CUT_PAPER;

  return commands;
}

function getDocumentType(type: string): string {
  switch (type) {
    case 'invoice': return 'RACUN';
    case 'proforma': return 'PREDRACUN';
    case 'delivery_note': return 'DOBAVNICA';
    case 'quote': return 'PONUDBA';
    default: return 'DOKUMENT';
  }
}

function getPaymentMethodText(method: string): string {
  switch (method) {
    case 'cash': return 'Gotovina';
    case 'card': return 'Kartica';
    case 'bank_transfer': return 'Bančni prenos';
    default: return method;
  }
}

/**
 * Bluetooth Manager - Native Implementation
 */

let BluetoothManager: any = null;
let BluetoothEscposPrinter: any = null;
let BluetoothTscPrinter: any = null;
let isPackageAvailable = false;

try {
  const BluetoothPrinterModule = require('react-native-bluetooth-escpos-printer');
  
  BluetoothManager = BluetoothPrinterModule.BluetoothManager;
  BluetoothEscposPrinter = BluetoothPrinterModule.BluetoothEscposPrinter;
  BluetoothTscPrinter = BluetoothPrinterModule.BluetoothTscPrinter;
  
  isPackageAvailable = true;
  console.log('✅ react-native-bluetooth-escpos-printer loaded successfully');
} catch (error) {
  console.warn('⚠️ react-native-bluetooth-escpos-printer ni na voljo:', error);
  console.warn('📦 Paket bo avtomatsko nameščen pri prvem buildu');
  isPackageAvailable = false;
}

async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    console.log('🔐 Requesting Bluetooth permissions...');
    console.log('📱 Android API Level:', Platform.Version);
    
    if (Platform.Version >= 31) {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];
      
      console.log('Requesting Android 12+ permissions:', permissions);
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      const allGranted = (
        granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
      
      console.log('Permissions result:', granted);
      console.log('All granted:', allGranted);
      
      return allGranted;
    } else {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];
      
      console.log('Requesting Android <12 permissions:', permissions);
      
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      const allGranted = (
        granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
      );
      
      console.log('Permissions result:', granted);
      console.log('All granted:', allGranted);
      
      return allGranted;
    }
  } catch (error) {
    console.error('❌ Permission request error:', error);
    return false;
  }
}

function checkPackageAvailability(): void {
  if (!isPackageAvailable || !BluetoothManager) {
    throw new Error(
      'Bluetooth paket ni na voljo. Paket react-native-bluetooth-escpos-printer bo avtomatsko nameščen pri naslednjem buildu aplikacije. Prosimo ponovno buildate aplikacijo.'
    );
  }
}

export async function initBluetooth(): Promise<void> {
  try {
    console.log('🔵 Initializing Bluetooth...');
    
    checkPackageAvailability();
    
    console.log('🔐 Checking permissions...');
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions niso odobrene. Omogočite Bluetooth dovoljenja v nastavitvah.');
    }
    
    console.log('✅ Permissions OK');
    
    console.log('🔵 Enabling Bluetooth...');
    const enabled = await BluetoothManager.enableBluetooth();
    console.log('Bluetooth enabled result:', enabled);
    
    console.log('✅ Bluetooth initialized successfully');
  } catch (error) {
    console.error('❌ Bluetooth initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Napaka pri omogočanju Bluetooth: ${errorMessage}`);
  }
}

export async function scanBluetoothPrinters(): Promise<BluetoothPrinter[]> {
  try {
    console.log('🔍 Starting Bluetooth scan...');
    
    checkPackageAvailability();
    
    await initBluetooth();
    
    console.log('📡 Scanning for devices...');
    
    let devicesJson: string = '[]';
    let devices: any[] = [];
    
    try {
      console.log('Method 1: Getting paired devices...');
      devicesJson = await BluetoothManager.list();
      console.log('Raw list result:', devicesJson);
      
      if (typeof devicesJson === 'string') {
        devices = JSON.parse(devicesJson);
      } else if (Array.isArray(devicesJson)) {
        devices = devicesJson;
      }
      
      console.log(`Found ${devices.length} paired devices`);
    } catch (listError) {
      console.warn('List failed, trying scan...', listError);
      
      try {
        console.log('Method 2: Scanning for new devices...');
        devicesJson = await BluetoothManager.scanDevices();
        console.log('Raw scan result:', devicesJson);
        
        if (typeof devicesJson === 'string') {
          devices = JSON.parse(devicesJson);
        } else if (Array.isArray(devicesJson)) {
          devices = devicesJson;
        }
        
        console.log(`Found ${devices.length} scanned devices`);
      } catch (scanError) {
        console.error('Scan also failed:', scanError);
        throw new Error('Ni bilo mogoče najti Bluetooth naprav');
      }
    }
    
    if (!Array.isArray(devices)) {
      console.error('Devices is not an array:', typeof devices, devices);
      devices = [];
    }
    
    console.log('✅ Total devices found:', devices.length);
    devices.forEach((d, i) => {
      console.log(`Device ${i + 1}:`, d);
    });
    
    const printers = devices.map((device: any) => ({
      id: device.address || device.id || device.name || `device_${Date.now()}`,
      name: device.name || 'Neznana naprava',
      address: device.address || device.id || '',
      connected: false,
    }));
    
    console.log('✅ Returning', printers.length, 'printers');
    return printers;
    
  } catch (error) {
    console.error('❌ Scan error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Neznana napaka';
    throw new Error(`Napaka pri iskanju Bluetooth naprav: ${errorMessage}`);
  }
}

export async function connectPrinter(address: string): Promise<void> {
  try {
    console.log('🔌 Connecting to printer:', address);
    
    checkPackageAvailability();
    
    const result = await BluetoothManager.connect(address);
    console.log('Connection result:', result);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🖨️ Initializing printer...');
    await BluetoothEscposPrinter.printerInit();
    
    console.log('✅ Printer connected and initialized');
  } catch (error) {
    console.error('❌ Connection error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Napaka pri povezovanju: ${errorMessage}`);
  }
}

export async function disconnectPrinter(): Promise<void> {
  try {
    await BluetoothManager.disconnect();
    console.log('Tiskalnik odklopljen');
  } catch (error) {
    console.error('Napaka pri odklopu:', error);
  }
}

export async function printReceiptBluetooth(
  invoice: Invoice,
  company: CompanySettings,
  printer: BluetoothPrinter,
  fursData?: FursData
): Promise<void> {
  try {
    console.log('Začetek tiskanja računa:', invoice.invoiceNumber);
    
    if (!printer.connected) {
      await connectPrinter(printer.address);
    }

    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    
    await BluetoothEscposPrinter.setBlob(0);
    await BluetoothEscposPrinter.printText(`${company.name}\n`, {
      fonttype: 1,
      widthtimes: 1,
      heigthtimes: 1,
    });
    await BluetoothEscposPrinter.printText(`${company.owner}\n`, {});
    await BluetoothEscposPrinter.printText(`${company.address}\n`, {});
    await BluetoothEscposPrinter.printText(`${company.postalCode} ${company.city}\n`, {});
    await BluetoothEscposPrinter.printText(`Davcna st.: ${company.taxNumber}\n`, {});
    if (company.phone) await BluetoothEscposPrinter.printText(`${company.phone}\n`, {});
    await BluetoothEscposPrinter.printText('================================\n', {});
    
    await BluetoothEscposPrinter.setBlob(0);
    const docType = getDocumentType(invoice.type);
    await BluetoothEscposPrinter.printText(`${docType}\n`, {
      fonttype: 1,
      widthtimes: 2,
      heigthtimes: 2,
    });
    await BluetoothEscposPrinter.printText(`${invoice.invoiceNumber}\n`, {
      fonttype: 1,
    });
    await BluetoothEscposPrinter.printText('================================\n', {});
    
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printColumn(
      [16, 16],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['Datum:', formatDate(invoice.issueDate)],
      {}
    );
    
    if (invoice.type === 'invoice') {
      await BluetoothEscposPrinter.printColumn(
        [16, 16],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Rok placila:', formatDate(invoice.dueDate)],
        {}
      );
    }
    
    await BluetoothEscposPrinter.printColumn(
      [16, 16],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['Nacin placila:', getPaymentMethodText(invoice.paymentMethod)],
      {}
    );
    await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    
    if (invoice.clientData.type === 'company') {
      await BluetoothEscposPrinter.printText('STRANKA:\n', { fonttype: 1 });
      await BluetoothEscposPrinter.printText(`${invoice.clientData.name}\n`, {});
      await BluetoothEscposPrinter.printText(`${invoice.clientData.address}\n`, {});
      await BluetoothEscposPrinter.printText(`${invoice.clientData.postalCode} ${invoice.clientData.city}\n`, {});
      if (invoice.clientData.taxNumber) {
        await BluetoothEscposPrinter.printText(`Davcna st.: ${invoice.clientData.taxNumber}\n`, {});
      }
    } else {
      await BluetoothEscposPrinter.printColumn(
        [16, 16],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['Stranka:', 'Fizicna oseba'],
        {}
      );
    }
    await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    
    await BluetoothEscposPrinter.printText('POSTAVKE\n', { fonttype: 1 });
    await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    
    for (let i = 0; i < invoice.items.length; i++) {
      const item = invoice.items[i];
      await BluetoothEscposPrinter.printText(`${i + 1}. ${item.serviceName}\n`, { fonttype: 1 });
      
      if (item.description) {
        const desc = item.description.length > 30 ? item.description.substring(0, 27) + '...' : item.description;
        await BluetoothEscposPrinter.printText(`  ${desc}\n`, {});
      }
      
      await BluetoothEscposPrinter.printText(`  ${item.quantity} ${item.unit} x ${formatCurrency(item.pricePerUnit)}\n`, {});
      
      await BluetoothEscposPrinter.printColumn(
        [16, 16],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        [`  Osnova (${item.ddvRate}% DDV):`, formatCurrency(item.totalWithoutDDV)],
        {}
      );
      
      await BluetoothEscposPrinter.printColumn(
        [16, 16],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
        ['  SKUPAJ:', formatCurrency(item.totalWithDDV)],
        { fonttype: 1 }
      );
      
      await BluetoothEscposPrinter.printText('\n', {});
    }
    
    await BluetoothEscposPrinter.printText('================================\n', {});
    
    await BluetoothEscposPrinter.printColumn(
      [16, 16],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['Skupaj brez DDV:', formatCurrency(invoice.subtotal)],
      {}
    );
    
    await BluetoothEscposPrinter.printColumn(
      [16, 16],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['DDV (22%):', formatCurrency(invoice.totalDDV)],
      {}
    );
    
    await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    
    await BluetoothEscposPrinter.printColumn(
      [16, 16],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      ['SKUPAJ:', formatCurrency(invoice.total)],
      { fonttype: 1, widthtimes: 1, heigthtimes: 1 }
    );
    
    await BluetoothEscposPrinter.printText('================================\n', {});
    
    if (fursData) {
      await BluetoothEscposPrinter.printText('\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('FURS POTRJEN RACUN\n', { fonttype: 1 });
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      
      await BluetoothEscposPrinter.printText('ZOI:\n', { fonttype: 1 });
      const zoiLines = fursData.zoi.match(/.{1,32}/g) || [fursData.zoi];
      for (const line of zoiLines) {
        await BluetoothEscposPrinter.printText(`${line}\n`, {});
      }
      
      await BluetoothEscposPrinter.printText('\nEOR:\n', { fonttype: 1 });
      const eorLines = fursData.eor.match(/.{1,32}/g) || [fursData.eor];
      for (const line of eorLines) {
        await BluetoothEscposPrinter.printText(`${line}\n`, {});
      }
      
      await BluetoothEscposPrinter.printText('\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('Preverjanje:\n', {});
      await BluetoothEscposPrinter.printText('blagajne.fu.gov.si\n', {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    }
    
    if (invoice.notes) {
      await BluetoothEscposPrinter.printText('\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText('OPOMBE:\n', { fonttype: 1 });
      await BluetoothEscposPrinter.printText(`${invoice.notes}\n`, {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    }
    
    await BluetoothEscposPrinter.printText('\n', {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('Hvala za poslovanje!\n', {});
    if (company.email) await BluetoothEscposPrinter.printText(`${company.email}\n`, {});
    if (company.website) await BluetoothEscposPrinter.printText(`${company.website}\n`, {});
    
    await BluetoothEscposPrinter.printAndFeedPaper(100);
    
    console.log(`Račun ${invoice.invoiceNumber} natisnjen na ${printer.name}`);
  } catch (error) {
    console.error('Napaka pri tiskanju:', error);
    throw new Error('Napaka pri tiskanju računa. Preverite povezavo s tiskalnikom.');
  }
}

export async function printTestReceipt(printer: BluetoothPrinter): Promise<void> {
  try {
    console.log('Začetek testnega tiskanja...');
    
    if (!printer.connected) {
      await connectPrinter(printer.address);
    }

    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    
    await BluetoothEscposPrinter.printText('TESTNO TISKANJE\n', {
      fonttype: 1,
      widthtimes: 1,
      heigthtimes: 1,
    });
    
    await BluetoothEscposPrinter.printText('================================\n', {});
    
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Tiskalnik: ${printer.name}\n`, {});
    await BluetoothEscposPrinter.printText(`Naslov: ${printer.address}\n`, {});
    await BluetoothEscposPrinter.printText(`Cas: ${new Date().toLocaleString('sl-SI')}\n`, {});
    await BluetoothEscposPrinter.printText('================================\n', {});
    
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('Tiskalnik deluje pravilno!\n', {});
    
    await BluetoothEscposPrinter.printAndFeedPaper(100);
    
    console.log('Testno tiskanje uspešno');
  } catch (error) {
    console.error('Napaka pri testnem tiskanju:', error);
    throw new Error('Napaka pri testnem tiskanju. Preverite povezavo.');
  }
}
