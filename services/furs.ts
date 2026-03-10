import type { Invoice, CompanySettings } from '@/types';
import { formatDate } from './calculations';

/**
 * FURS Fiskalizacija Service
 * 
 * Implementira osnovno strukturo za FURS fiskalizacijo računov v Sloveniji.
 * Za produkcijo potrebujete:
 * 1. Digitalni certifikat FURS (p12 format)
 * 2. Registrirano elektronsko napravo
 * 3. Registriran poslovni prostor
 */

export interface FursData {
  zoi: string; // Zaščitena oznaka izdajatelja
  eor: string; // Enolična oznaka računa
  qrCode: string; // QR koda za preverjanje
  timestamp: number;
}

/**
 * Generira ZOI (Zaščitena oznaka izdajatelja)
 * V produkciji: digitalni podpis z FURS certifikatom
 * Demo verzija: hash na osnovi podatkov računa
 */
export function generateZOI(invoice: Invoice, company: CompanySettings): string {
  const data = [
    company.taxNumber,
    invoice.issueDate.toString(),
    invoice.invoiceNumber,
    invoice.total.toFixed(2),
  ].join('|');
  
  // Demo implementacija - v produkciji uporabite FURS certifikat za RSA podpis
  const hash = simpleHash(data);
  return hash.substring(0, 32).toUpperCase();
}

/**
 * Generira EOR (Enolična oznaka računa)
 * Format: [davčna številka]-[oznaka naprave]-[številka računa]
 */
export function generateEOR(invoice: Invoice, company: CompanySettings): string {
  const deviceId = 'B1'; // ID naprave - v produkciji nastavite pravilno
  return `${company.taxNumber}-${deviceId}-${invoice.invoiceNumber}`;
}

/**
 * Generira QR kodo za preverjanje računa na FURS portalu
 * Format QR vsebine po FURS specifikaciji
 */
export function generateQRContent(fursData: FursData, invoice: Invoice): string {
  const date = formatDate(invoice.issueDate).split('.').reverse().join('-'); // YYYY-MM-DD
  const time = new Date(invoice.issueDate).toLocaleTimeString('sl-SI', { hour12: false });
  
  return [
    fursData.zoi,
    fursData.eor,
    date,
    time,
    invoice.total.toFixed(2),
  ].join(';');
}

/**
 * Generira vse FURS podatke za račun
 */
export function generateFursData(invoice: Invoice, company: CompanySettings): FursData {
  const zoi = generateZOI(invoice, company);
  const eor = generateEOR(invoice, company);
  const timestamp = Date.now();
  
  const qrData: FursData = { zoi, eor, qrCode: '', timestamp };
  const qrCode = generateQRContent(qrData, invoice);
  
  return {
    zoi,
    eor,
    qrCode,
    timestamp,
  };
}

/**
 * Validira ali je račun pripravljen za fiskalizacijo
 */
export function canFiscalize(invoice: Invoice, company: CompanySettings): boolean {
  // Preveri ali so izpolnjeni vsi podatki
  if (!company.taxNumber || !invoice.invoiceNumber) return false;
  if (invoice.items.length === 0) return false;
  if (invoice.total <= 0) return false;
  
  return true;
}

/**
 * Enostavna hash funkcija za demo namene
 * V produkciji uporabite RSA digitalni podpis z FURS certifikatom
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Formatira podatke za FURS API request
 * To je osnovna struktura - za produkcijo potrebujete XML z digitalnim podpisom
 */
export interface FursApiRequest {
  taxNumber: string;
  issuerTaxNumber: string;
  businessPremiseId: string;
  electronicDeviceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceTime: string;
  taxesPerSeller: Array<{
    ddvRate: number;
    taxBase: number;
    taxAmount: number;
  }>;
  invoiceAmount: number;
  paymentMethod: string;
  protectedId: string; // ZOI
}

export function prepareFursApiRequest(
  invoice: Invoice,
  company: CompanySettings,
  fursData: FursData
): FursApiRequest {
  // Združi postavke po DDV stopnjah
  const taxGroups = new Map<number, { base: number; amount: number }>();
  
  invoice.items.forEach(item => {
    const existing = taxGroups.get(item.ddvRate) || { base: 0, amount: 0 };
    taxGroups.set(item.ddvRate, {
      base: existing.base + item.totalWithoutDDV,
      amount: existing.amount + item.ddvAmount,
    });
  });
  
  const taxesPerSeller = Array.from(taxGroups.entries()).map(([rate, data]) => ({
    ddvRate: rate,
    taxBase: Math.round(data.base * 100) / 100,
    taxAmount: Math.round(data.amount * 100) / 100,
  }));
  
  const date = new Date(invoice.issueDate);
  
  return {
    taxNumber: company.taxNumber,
    issuerTaxNumber: company.taxNumber,
    businessPremiseId: 'PP1', // Poslovni prostor - v produkciji nastavite pravilno
    electronicDeviceId: 'B1', // Elektronska naprava - v produkciji nastavite pravilno
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: formatDate(invoice.issueDate).split('.').reverse().join('-'),
    invoiceTime: date.toLocaleTimeString('sl-SI', { hour12: false }),
    taxesPerSeller,
    invoiceAmount: invoice.total,
    paymentMethod: invoice.paymentMethod === 'Gotovina' ? 'GOTOVINA' : 'GOTOVINA',
    protectedId: fursData.zoi,
  };
}
