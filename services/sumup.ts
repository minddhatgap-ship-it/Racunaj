import type { Invoice } from '@/types';

/**
 * SumUp Payment Integration
 * 
 * Za uporabo potrebujete:
 * 1. SumUp račun (https://sumup.com/sl-si/)
 * 2. API ključe (pridobite v SumUp Dashboard)
 * 3. Nastavite API ključ v nastavitvah aplikacije
 */

export interface SumUpConfig {
  apiKey: string;
  merchantId: string;
  affiliateKey: string;
}

export interface SumUpPayment {
  id: string;
  transactionCode: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED';
  timestamp: number;
  cardType?: string;
  cardLast4?: string;
}

/**
 * Inicializira SumUp plačilo za račun
 */
export async function initiateSumUpPayment(
  invoice: Invoice,
  config: SumUpConfig
): Promise<SumUpPayment> {
  // V produkciji: pokličite SumUp API
  // Za demo verzijo vrnemo simuliran odgovor
  
  if (!config.apiKey || !config.merchantId) {
    throw new Error('SumUp API ključi niso nastavljeni. Prosim konfigurirajte v nastavitvah.');
  }

  // Demo implementacija - v produkciji uporabite pravi SumUp API
  const demoPayment: SumUpPayment = {
    id: `sumup_${Date.now()}`,
    transactionCode: generateTransactionCode(),
    amount: invoice.total,
    currency: 'EUR',
    status: 'PENDING',
    timestamp: Date.now(),
  };

  return demoPayment;
}

/**
 * Preveri status SumUp plačila
 */
export async function checkPaymentStatus(
  paymentId: string,
  config: SumUpConfig
): Promise<SumUpPayment> {
  // V produkciji: pokličite SumUp API za preverjanje statusa
  
  // Demo implementacija
  const demoPayment: SumUpPayment = {
    id: paymentId,
    transactionCode: generateTransactionCode(),
    amount: 0,
    currency: 'EUR',
    status: 'SUCCESSFUL',
    timestamp: Date.now(),
    cardType: 'VISA',
    cardLast4: '4242',
  };

  return demoPayment;
}

/**
 * Odpre SumUp plačilno aplikacijo za mobilno plačilo
 * Deluje samo na fizičnih napravah z nameščeno SumUp aplikacijo
 */
export async function openSumUpApp(amount: number, reference: string): Promise<void> {
  // Deep link za SumUp aplikacijo
  const sumupUrl = `sumupmerchant://pay/1.0?total=${amount}&currency=EUR&reference=${reference}`;
  
  // V produkciji uporabite Linking API za odpiranje aplikacije
  console.log('Open SumUp App:', sumupUrl);
  
  // Za demo
  throw new Error('SumUp aplikacija ni nameščena. Namestite SumUp aplikacijo iz App Store ali Google Play.');
}

/**
 * Generira edinstveno transakcijsko kodo
 */
function generateTransactionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TX';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validira SumUp konfiguracijo
 */
export function validateSumUpConfig(config: Partial<SumUpConfig>): boolean {
  return !!(config.apiKey && config.merchantId);
}

/**
 * SumUp webhook handler
 * Obdela callbacks iz SumUp sistema
 */
export interface SumUpWebhookPayload {
  event_type: 'payment_successful' | 'payment_failed' | 'payment_cancelled';
  payment_id: string;
  amount: number;
  currency: string;
  merchant_reference: string;
  card_type?: string;
  card_last_4_digits?: string;
  timestamp: string;
}

export function handleSumUpWebhook(payload: SumUpWebhookPayload): SumUpPayment {
  return {
    id: payload.payment_id,
    transactionCode: payload.merchant_reference,
    amount: payload.amount,
    currency: payload.currency,
    status: payload.event_type === 'payment_successful' ? 'SUCCESSFUL' : 
            payload.event_type === 'payment_failed' ? 'FAILED' : 'CANCELLED',
    timestamp: new Date(payload.timestamp).getTime(),
    cardType: payload.card_type,
    cardLast4: payload.card_last_4_digits,
  };
}
