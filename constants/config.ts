// DDV stopnje v Sloveniji
export const DDV_RATES = {
  STANDARD: 22,
  REDUCED: 9.5,
  NONE: 0,
};

// Tipi dokumentov
export const DOCUMENT_TYPES = {
  INVOICE: 'invoice',
  PROFORMA: 'proforma',
  DELIVERY_NOTE: 'delivery_note',
  QUOTE: 'quote',
} as const;

export const DOCUMENT_TYPE_LABELS = {
  invoice: 'Račun',
  proforma: 'Predračun',
  delivery_note: 'Dobavnica',
  quote: 'Ponudba',
};

// Privzeti podjetniški podatki (primer)
export const DEFAULT_COMPANY_DATA = {
  name: 'Moje Podjetje s.p.',
  address: 'Slovenska cesta 1',
  city: '1000 Ljubljana',
  country: 'Slovenija',
  taxNumber: 'SI12345678',
  registrationNumber: '1234567000',
  iban: 'SI56 0110 0600 0123 456',
  bic: 'BSLJSI2X',
  phone: '+386 1 234 5678',
  email: 'info@mojeподjetје.si',
};

// Številčenje računov
export const INVOICE_PREFIX = 'R';
export const CURRENT_YEAR = new Date().getFullYear();
