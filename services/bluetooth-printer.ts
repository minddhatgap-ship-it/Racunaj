/**
 * Bluetooth POS Printer Service
 * Podpora za 58mm termične tiskalnike z ESC/POS komandami
 * 
 * Za React Native uporabljamo react-native-bluetooth-escpos-printer
 * Instalacija: npm install react-native-bluetooth-escpos-printer
 */

import type { Invoice, CompanySettings, BluetoothPrinter } from '@/types';
import { formatCurrency, formatDate } from './calculations';
import type { FursData } from './furs';

/**
 * ESC/POS konstante za 58mm papir
 */
const ESC = '\x1B';
const GS = '\x1D';

// Tekstovne komande
const CMD = {
  INIT: `${ESC}@`,                    // Inicializacija
  ALIGN_LEFT: `${ESC}a\x00`,          // Poravnava levo
  ALIGN_CENTER: `${ESC}a\x01`,        // Poravnava center
  ALIGN_RIGHT: `${ESC}a\x02`,         // Poravnava desno
  BOLD_ON: `${ESC}E\x01`,             // Krepko ON
  BOLD_OFF: `${ESC}E\x00`,            // Krepko OFF
  SIZE_NORMAL: `${GS}!\x00`,          // Normalna velikost
  SIZE_DOUBLE: `${GS}!\x11`,          // 2x velikost
  SIZE_LARGE: `${GS}!\x22`,           // 3x velikost
  UNDERLINE_ON: `${ESC}-\x01`,        // Podčrtano ON
  UNDERLINE_OFF: `${ESC}-\x00`,       // Podčrtano OFF
  CUT_PAPER: `${GS}V\x00`,            // Reži papir
  FEED_LINE: '\n',                     // Nova vrstica
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`, // N vrstic
};

// Širina tiskalnika (znaki za 58mm papir)
const LINE_WIDTH = 32;

/**
 * Funkcije za formatiranje besedila
 */
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

/**
 * Ustvari ESC/POS komande za tiskanje računa
 */
export function generateReceiptCommands(
  invoice: Invoice,
  company: CompanySettings,
  fursData?: FursData
): string {
  let commands = '';

  // Inicializacija
  commands += CMD.INIT;

  // Logo/Header
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

  // Tip dokumenta in številka
  commands += CMD.SIZE_LARGE;
  commands += CMD.BOLD_ON;
  const docType = getDocumentType(invoice.type);
  commands += centerText(docType) + CMD.FEED_LINE;
  commands += CMD.SIZE_NORMAL;
  commands += centerText(invoice.invoiceNumber) + CMD.FEED_LINE;
  commands += CMD.BOLD_OFF;
  commands += separator('=') + CMD.FEED_LINE;

  // Datum in čas
  commands += CMD.ALIGN_LEFT;
  commands += twoColumn('Datum:', formatDate(invoice.issueDate)) + CMD.FEED_LINE;
  if (invoice.type === 'invoice') {
    commands += twoColumn('Rok placila:', formatDate(invoice.dueDate)) + CMD.FEED_LINE;
  }
  commands += twoColumn('Nacin placila:', getPaymentMethodText(invoice.paymentMethod)) + CMD.FEED_LINE;
  commands += separator() + CMD.FEED_LINE;

  // Stranka
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

  // Postavke
  commands += CMD.BOLD_ON + 'POSTAVKE' + CMD.BOLD_OFF + CMD.FEED_LINE;
  commands += separator() + CMD.FEED_LINE;

  invoice.items.forEach((item, index) => {
    // Naziv
    commands += CMD.BOLD_ON + `${index + 1}. ${item.serviceName}` + CMD.BOLD_OFF + CMD.FEED_LINE;
    
    // Opis (če obstaja)
    if (item.description) {
      const descLines = wrapText(item.description, LINE_WIDTH - 2);
      descLines.forEach(line => {
        commands += `  ${line}` + CMD.FEED_LINE;
      });
    }
    
    // Količina x Cena
    commands += `  ${item.quantity} ${item.unit} x ${formatCurrency(item.pricePerUnit)}` + CMD.FEED_LINE;
    
    // Osnova (brez DDV)
    commands += twoColumn(`  Osnova (${item.ddvRate}% DDV):`, formatCurrency(item.totalWithoutDDV)) + CMD.FEED_LINE;
    
    // Skupaj z DDV
    commands += CMD.BOLD_ON;
    commands += twoColumn('  SKUPAJ:', formatCurrency(item.totalWithDDV)) + CMD.FEED_LINE;
    commands += CMD.BOLD_OFF;
    commands += CMD.FEED_LINE;
  });

  commands += separator('=') + CMD.FEED_LINE;

  // Seštevek
  commands += twoColumn('Skupaj brez DDV:', formatCurrency(invoice.subtotal)) + CMD.FEED_LINE;
  commands += twoColumn(`DDV (22%):`, formatCurrency(invoice.totalDDV)) + CMD.FEED_LINE;
  commands += separator() + CMD.FEED_LINE;
  commands += CMD.SIZE_DOUBLE;
  commands += CMD.BOLD_ON;
  commands += twoColumn('SKUPAJ:', formatCurrency(invoice.total)) + CMD.FEED_LINE;
  commands += CMD.BOLD_OFF;
  commands += CMD.SIZE_NORMAL;
  commands += separator('=') + CMD.FEED_LINE;

  // FURS podatki
  if (fursData) {
    commands += CMD.FEED_LINE;
    commands += CMD.ALIGN_CENTER;
    commands += CMD.BOLD_ON + 'FURS POTRJEN RACUN' + CMD.BOLD_OFF + CMD.FEED_LINE;
    commands += separator() + CMD.FEED_LINE;
    commands += CMD.ALIGN_LEFT;
    commands += CMD.BOLD_ON + 'ZOI:' + CMD.BOLD_OFF + CMD.FEED_LINE;
    
    // ZOI v več vrsticah (32 znakov na vrstico)
    const zoiLines = fursData.zoi.match(/.{1,32}/g) || [fursData.zoi];
    zoiLines.forEach(line => {
      commands += line + CMD.FEED_LINE;
    });
    
    commands += CMD.FEED_LINE;
    commands += CMD.BOLD_ON + 'EOR:' + CMD.BOLD_OFF + CMD.FEED_LINE;
    
    // EOR v več vrsticah
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

  // Opombe
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

  // Footer
  commands += CMD.FEED_LINE;
  commands += CMD.ALIGN_CENTER;
  commands += 'Hvala za poslovanje!' + CMD.FEED_LINE;
  if (company.email) commands += company.email + CMD.FEED_LINE;
  if (company.website) commands += company.website + CMD.FEED_LINE;
  
  // Prazne vrstice pred rezanjem
  commands += CMD.FEED_LINES(3);
  
  // Reži papir
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
 * Bluetooth Printer Manager
 * Uporablja react-native-bluetooth-escpos-printer za dejanske Bluetooth tiskalnik operacije
 */

import { Platform, PermissionsAndroid } from 'react-native';

// Import dejanskega Bluetooth ESC/POS paketa
let BluetoothManager: any;
let BluetoothEscposPrinter: any;

try {
  // Poskusi naložiti paket (bo avtomatsko nameščen)
  const printer = require('react-native-bluetooth-escpos-printer');
  BluetoothManager = printer.BluetoothManager;
  BluetoothEscposPrinter = printer.BluetoothEscposPrinter;
} catch (error) {
  console.warn('react-native-bluetooth-escpos-printer ni nameščen. Bluetooth tiskanje ne bo delovalo.');
  // Fallback na mock če paket ni na voljo
  BluetoothManager = {
    enableBluetooth: async () => console.log('Mock: Bluetooth enabled'),
    scanDevices: async () => [],
    connect: async () => console.log('Mock: Connected'),
    disconnect: async () => console.log('Mock: Disconnected'),
  };
  BluetoothEscposPrinter = {
    printerInit: async () => {},
    printText: async () => {},
    printColumn: async () => {},
    printQRCode: async () => {},
    printerAlign: async () => {},
    setBlob: async () => {},
    printAndFeedPaper: async () => {},
    cutPaper: async () => {},
  };
}

/**
 * Zahteva Bluetooth permissions za Android
 */
async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      // Android 12+ zahteva nove permissions
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        // Starejše verzije Androida
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_ADMIN'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }
  return true; // iOS ne potrebuje runtime permissions
}

/**
 * Inicializira Bluetooth
 */
export async function initBluetooth(): Promise<void> {
  try {
    // Preveri permissions
    const hasPermission = await requestBluetoothPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions niso odobrene');
    }
    
    // Omogoči Bluetooth
    await BluetoothManager.enableBluetooth();
  } catch (error) {
    console.error('Bluetooth napaka:', error);
    throw new Error('Napaka pri omogočanju Bluetooth. Preverite ali je Bluetooth vklopljen.');
  }
}

/**
 * Išče Bluetooth tiskalnike
 */
export async function scanBluetoothPrinters(): Promise<BluetoothPrinter[]> {
  try {
    console.log('Začetek Bluetooth scan...');
    await initBluetooth();
    
    // Pridobi seznam sparjenih naprav (list) ali skeniraj nove (scanDevices)
    // react-native-bluetooth-escpos-printer vrne JSON string, ne array
    let devicesJson: string;
    
    try {
      // Najprej poskusi pridobiti sparjene naprave
      devicesJson = await BluetoothManager.list();
      console.log('Sparjene naprave:', devicesJson);
    } catch (listError) {
      console.log('List failed, trying scan...', listError);
      // Če to ne deluje, poskusi skenirati
      devicesJson = await BluetoothManager.scanDevices();
      console.log('Scan result:', devicesJson);
    }
    
    // Parse JSON rezultat
    let devices: any[] = [];
    try {
      devices = JSON.parse(devicesJson);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Če je že array, uporabi direktno
      if (Array.isArray(devicesJson)) {
        devices = devicesJson;
      } else {
        throw new Error('Napaka pri obdelavi rezultatov');
      }
    }
    
    console.log('Najdenih naprav:', devices.length);
    
    // Pretvori v naš format
    return devices.map((device: any) => ({
      id: device.address || device.id || device.name,
      name: device.name || 'Neznana naprava',
      address: device.address || device.id,
      connected: false,
    }));
  } catch (error) {
    console.error('Napaka pri iskanju tiskalnikov:', error);
    const errorMessage = error instanceof Error ? error.message : 'Neznana napaka';
    throw new Error(`Napaka pri iskanju Bluetooth naprav: ${errorMessage}. Preverite ali je Bluetooth vklopljen in ali imate dovoljenja.`);
  }
}

/**
 * Poveže se s tiskalnikom
 */
export async function connectPrinter(address: string): Promise<void> {
  try {
    console.log('Povezovanje s tiskalnikom:', address);
    await BluetoothManager.connect(address);
    console.log('Povezava uspešna');
    
    // Inicializiraj tiskalnik
    await BluetoothEscposPrinter.printerInit();
  } catch (error) {
    console.error('Napaka pri povezovanju:', error);
    throw new Error('Napaka pri povezovanju s tiskalnikom. Preverite ali je tiskalnik vklopljen in v dosegu.');
  }
}

/**
 * Odklopi tiskalnik
 */
export async function disconnectPrinter(): Promise<void> {
  try {
    await BluetoothManager.disconnect();
    console.log('Tiskalnik odklopljen');
  } catch (error) {
    console.error('Napaka pri odklopu:', error);
    // Ne vrzi napake - odklop ni kritičen
  }
}

/**
 * Natisne račun na Bluetooth tiskalniku
 */
export async function printReceiptBluetooth(
  invoice: Invoice,
  company: CompanySettings,
  printer: BluetoothPrinter,
  fursData?: FursData
): Promise<void> {
  try {
    console.log('Začetek tiskanja računa:', invoice.invoiceNumber);
    
    // Poveži se s tiskalnikom če še ni povezan
    if (!printer.connected) {
      await connectPrinter(printer.address);
    }

    // Inicializacija tiskalnika
    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    
    // HEADER
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
    
    // TIP DOKUMENTA
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
    
    // DATUM
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
    
    // STRANKA
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
    
    // POSTAVKE
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
    
    // SEŠTEVEK
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
    
    // FURS PODATKI
    if (fursData) {
      await BluetoothEscposPrinter.printText('\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
      await BluetoothEscposPrinter.printText('FURS POTRJEN RACUN\n', { fonttype: 1 });
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      
      await BluetoothEscposPrinter.printText('ZOI:\n', { fonttype: 1 });
      // ZOI v več vrsticah
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
    
    // OPOMBE
    if (invoice.notes) {
      await BluetoothEscposPrinter.printText('\n', {});
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      await BluetoothEscposPrinter.printText('OPOMBE:\n', { fonttype: 1 });
      await BluetoothEscposPrinter.printText(`${invoice.notes}\n`, {});
      await BluetoothEscposPrinter.printText('--------------------------------\n', {});
    }
    
    // FOOTER
    await BluetoothEscposPrinter.printText('\n', {});
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('Hvala za poslovanje!\n', {});
    if (company.email) await BluetoothEscposPrinter.printText(`${company.email}\n`, {});
    if (company.website) await BluetoothEscposPrinter.printText(`${company.website}\n`, {});
    
    // Prazne vrstice in rez
    await BluetoothEscposPrinter.printAndFeedPaper(100);
    
    console.log(`Račun ${invoice.invoiceNumber} natisnjen na ${printer.name}`);
  } catch (error) {
    console.error('Napaka pri tiskanju:', error);
    throw new Error('Napaka pri tiskanju računa. Preverite povezavo s tiskalnikom.');
  }
}

/**
 * Testno tiskanje
 */
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
