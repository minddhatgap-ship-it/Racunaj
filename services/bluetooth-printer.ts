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
 * 
 * POMEMBNO: Za produkcijo uporabite react-native-bluetooth-escpos-printer
 * npm install react-native-bluetooth-escpos-printer
 */

// Mock implementacija - v produkciji zamenjajte z dejanskim paketom
interface BluetoothManager {
  enableBluetooth(): Promise<void>;
  scanDevices(): Promise<BluetoothPrinter[]>;
  connect(address: string): Promise<void>;
  disconnect(): Promise<void>;
  printText(text: string, encoding?: string): Promise<void>;
  printRawData(data: string): Promise<void>;
}

// Za produkcijo:
// import { BluetoothManager } from 'react-native-bluetooth-escpos-printer';

/**
 * Mock Bluetooth Manager za razvoj
 */
const MockBluetoothManager: BluetoothManager = {
  async enableBluetooth() {
    console.log('Bluetooth omogočen (MOCK)');
  },
  
  async scanDevices() {
    console.log('Iskanje naprav (MOCK)');
    // Simulirani tiskalniki
    return [
      {
        id: 'mock-1',
        name: 'POS-58MM-001',
        address: '00:11:22:33:44:55',
        connected: false,
      },
      {
        id: 'mock-2',
        name: 'Thermal Printer',
        address: '00:11:22:33:44:66',
        connected: false,
      },
    ];
  },
  
  async connect(address: string) {
    console.log(`Povezovanje s tiskalnikom: ${address} (MOCK)`);
  },
  
  async disconnect() {
    console.log('Tiskalnik odklopljen (MOCK)');
  },
  
  async printText(text: string) {
    console.log('Tiskanje besedila (MOCK):', text);
  },
  
  async printRawData(data: string) {
    console.log('Tiskanje ESC/POS komand (MOCK)');
    console.log('Dolžina komand:', data.length);
  },
};

/**
 * Inicializira Bluetooth
 */
export async function initBluetooth(): Promise<void> {
  try {
    await MockBluetoothManager.enableBluetooth();
  } catch (error) {
    console.error('Bluetooth napaka:', error);
    throw new Error('Napaka pri omogočanju Bluetooth');
  }
}

/**
 * Išče Bluetooth tiskalnike
 */
export async function scanBluetoothPrinters(): Promise<BluetoothPrinter[]> {
  try {
    await initBluetooth();
    const devices = await MockBluetoothManager.scanDevices();
    return devices;
  } catch (error) {
    console.error('Napaka pri iskanju tiskalnikov:', error);
    throw new Error('Napaka pri iskanju Bluetooth naprav');
  }
}

/**
 * Poveže se s tiskalnikom
 */
export async function connectPrinter(address: string): Promise<void> {
  try {
    await MockBluetoothManager.connect(address);
  } catch (error) {
    console.error('Napaka pri povezovanju:', error);
    throw new Error('Napaka pri povezovanju s tiskalnikom');
  }
}

/**
 * Odklopi tiskalnik
 */
export async function disconnectPrinter(): Promise<void> {
  try {
    await MockBluetoothManager.disconnect();
  } catch (error) {
    console.error('Napaka pri odklopu:', error);
    throw new Error('Napaka pri odklopu tiskalnika');
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
    // Poveži se s tiskalnikom če še ni povezan
    if (!printer.connected) {
      await connectPrinter(printer.address);
    }

    // Generiraj ESC/POS komande
    const commands = generateReceiptCommands(invoice, company, fursData);

    // Natisni
    await MockBluetoothManager.printRawData(commands);

    console.log(`Račun ${invoice.invoiceNumber} natisnjen na ${printer.name}`);
  } catch (error) {
    console.error('Napaka pri tiskanju:', error);
    throw new Error('Napaka pri tiskanju računa');
  }
}

/**
 * Testno tiskanje
 */
export async function printTestReceipt(printer: BluetoothPrinter): Promise<void> {
  try {
    if (!printer.connected) {
      await connectPrinter(printer.address);
    }

    let commands = '';
    commands += CMD.INIT;
    commands += CMD.ALIGN_CENTER;
    commands += CMD.SIZE_DOUBLE;
    commands += CMD.BOLD_ON;
    commands += 'TESTNO TISKANJE' + CMD.FEED_LINE;
    commands += CMD.BOLD_OFF;
    commands += CMD.SIZE_NORMAL;
    commands += separator('=') + CMD.FEED_LINE;
    commands += CMD.ALIGN_LEFT;
    commands += `Tiskalnik: ${printer.name}` + CMD.FEED_LINE;
    commands += `Naslov: ${printer.address}` + CMD.FEED_LINE;
    commands += `Čas: ${new Date().toLocaleString('sl-SI')}` + CMD.FEED_LINE;
    commands += separator('=') + CMD.FEED_LINE;
    commands += CMD.ALIGN_CENTER;
    commands += 'Tiskalnik deluje pravilno!' + CMD.FEED_LINE;
    commands += CMD.FEED_LINES(3);
    commands += CMD.CUT_PAPER;

    await MockBluetoothManager.printRawData(commands);
  } catch (error) {
    console.error('Napaka pri testnem tiskanju:', error);
    throw new Error('Napaka pri testnem tiskanju');
  }
}
