import type { Invoice, CompanySettings } from '@/types';
import { formatDate, formatCurrency } from './calculations';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Export Service
 * Izvoz podatkov v različne formate (XML, CSV, JSON)
 */

/**
 * XML izvoz za FURS eDavki portal
 * Format skladen s FURS specifikacijo za DDV poročanje
 */
export async function exportToFursXML(
  invoices: Invoice[],
  company: CompanySettings,
  period: { from: number; to: number }
): Promise<void> {
  const xml = generateFursXML(invoices, company, period);
  const fileName = `FURS_DDV_${formatDate(period.from).replace(/\./g, '')}_${formatDate(period.to).replace(/\./g, '')}.xml`;
  
  await saveAndShareFile(xml, fileName, 'text/xml');
}

function generateFursXML(
  invoices: Invoice[],
  company: CompanySettings,
  period: { from: number; to: number }
): string {
  // Filtriraj račune v obdobju
  const periodInvoices = invoices.filter(inv => 
    inv.type === 'invoice' && 
    inv.issueDate >= period.from && 
    inv.issueDate <= period.to
  );

  // Združi po DDV stopnjah
  const taxGroups = new Map<number, { base: number; amount: number; total: number; count: number }>();
  
  periodInvoices.forEach(inv => {
    inv.items.forEach(item => {
      const existing = taxGroups.get(item.ddvRate) || { base: 0, amount: 0, total: 0, count: 0 };
      taxGroups.set(item.ddvRate, {
        base: existing.base + item.totalWithoutDDV,
        amount: existing.amount + item.ddvAmount,
        total: existing.total + item.totalWithDDV,
        count: existing.count + 1,
      });
    });
  });

  const totalBase = Array.from(taxGroups.values()).reduce((sum, g) => sum + g.base, 0);
  const totalTax = Array.from(taxGroups.values()).reduce((sum, g) => sum + g.amount, 0);
  const totalAmount = Array.from(taxGroups.values()).reduce((sum, g) => sum + g.total, 0);

  const fromDate = new Date(period.from);
  const toDate = new Date(period.to);
  const periodStr = `${fromDate.getMonth() + 1}/${fromDate.getFullYear()}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<edavki xmlns="http://edavki.durs.si/Documents/Schemas/DDV_O_v2_0.xsd">
  <header>
    <taxpayer>
      <taxNumber>${company.taxNumber}</taxNumber>
      <taxpayerType>FO</taxpayerType>
      <name>${company.name}</name>
    </taxpayer>
    <form>
      <formType>DDV-O</formType>
      <formVersion>2.0</formVersion>
    </form>
    <period>
      <periodStart>${formatDate(period.from).split('.').reverse().join('-')}</periodStart>
      <periodEnd>${formatDate(period.to).split('.').reverse().join('-')}</periodEnd>
    </period>
    <documentDate>${formatDate(Date.now()).split('.').reverse().join('-')}</documentDate>
  </header>
  <body>
    <ddvObdobje>
      <obdobje>${periodStr}</obdobje>
      <leto>${fromDate.getFullYear()}</leto>
    </ddvObdobje>
    
    <!-- Oddane storitve in prodano blago -->
    <oddaneStoritve>
      ${Array.from(taxGroups.entries()).map(([rate, data]) => `
      <postavka>
        <stopnjaDDV>${rate}</stopnjaDDV>
        <osnovaDDV>${data.base.toFixed(2)}</osnovaDDV>
        <znesekDDV>${data.amount.toFixed(2)}</znesekDDV>
        <skupajZIzracunanoDDV>${data.total.toFixed(2)}</skupajZIzracunanoDDV>
        <steviloRacunov>${data.count}</steviloRacunov>
      </postavka>
      `).join('')}
    </oddaneStoritve>
    
    <!-- Rekapitulacija -->
    <rekapitulacija>
      <osnovaDDVSkupaj>${totalBase.toFixed(2)}</osnovaDDVSkupaj>
      <znesekDDVSkupaj>${totalTax.toFixed(2)}</znesekDDVSkupaj>
      <skupajZaPlacilo>${totalAmount.toFixed(2)}</skupajZaPlacilo>
      <steviloRacunovSkupaj>${periodInvoices.length}</steviloRacunovSkupaj>
    </rekapitulacija>
    
    <!-- Podrobnosti računov -->
    <racuni>
      ${periodInvoices.map(inv => `
      <racun>
        <stevilkaRacuna>${inv.invoiceNumber}</stevilkaRacuna>
        <datumIzdaje>${formatDate(inv.issueDate).split('.').reverse().join('-')}</datumIzdaje>
        <kupec>
          <naziv>${inv.clientData.name}</naziv>
          ${inv.clientData.taxNumber ? `<davcnaStevilka>${inv.clientData.taxNumber}</davcnaStevilka>` : ''}
          ${inv.clientData.type === 'company' ? `
          <naslov>${inv.clientData.address}</naslov>
          <kraj>${inv.clientData.city}</kraj>
          <postnaStevilka>${inv.clientData.postalCode}</postnaStevilka>
          ` : ''}
        </kupec>
        <osnovaDDV>${inv.subtotal.toFixed(2)}</osnovaDDV>
        <znesekDDV>${inv.totalDDV.toFixed(2)}</znesekDDV>
        <skupaj>${inv.total.toFixed(2)}</skupaj>
        <nacinPlacila>${inv.paymentMethod}</nacinPlacila>
        ${inv.isPaid ? `<placano>DA</placano>` : `<placano>NE</placano>`}
        ${inv.paidAt ? `<datumPlacila>${formatDate(inv.paidAt).split('.').reverse().join('-')}</datumPlacila>` : ''}
      </racun>
      `).join('')}
    </racuni>
  </body>
</edavki>`;
}

/**
 * CSV izvoz za Excel
 */
export async function exportToCSV(
  invoices: Invoice[],
  period: { from: number; to: number }
): Promise<void> {
  const csv = generateCSV(invoices, period);
  const fileName = `Racuni_${formatDate(period.from).replace(/\./g, '')}_${formatDate(period.to).replace(/\./g, '')}.csv`;
  
  await saveAndShareFile(csv, fileName, 'text/csv');
}

function generateCSV(invoices: Invoice[], period: { from: number; to: number }): string {
  const periodInvoices = invoices.filter(inv => 
    inv.type === 'invoice' && 
    inv.issueDate >= period.from && 
    inv.issueDate <= period.to
  );

  const headers = [
    'Številka računa',
    'Datum izdaje',
    'Rok plačila',
    'Stranka',
    'Davčna številka',
    'Osnova brez DDV',
    'DDV',
    'Skupaj',
    'Plačano',
    'Datum plačila',
    'Način plačila',
  ];

  const rows = periodInvoices.map(inv => [
    inv.invoiceNumber,
    formatDate(inv.issueDate),
    formatDate(inv.dueDate),
    inv.clientData.name,
    inv.clientData.taxNumber || '',
    inv.subtotal.toFixed(2),
    inv.totalDDV.toFixed(2),
    inv.total.toFixed(2),
    inv.isPaid ? 'DA' : 'NE',
    inv.paidAt ? formatDate(inv.paidAt) : '',
    inv.paymentMethod,
  ]);

  return [
    headers.join(';'),
    ...rows.map(row => row.join(';')),
  ].join('\n');
}

/**
 * JSON izvoz za backup
 */
export async function exportToJSON(
  invoices: Invoice[],
  period: { from: number; to: number }
): Promise<void> {
  const periodInvoices = invoices.filter(inv => 
    inv.issueDate >= period.from && 
    inv.issueDate <= period.to
  );

  const data = {
    exportDate: new Date().toISOString(),
    period: {
      from: formatDate(period.from),
      to: formatDate(period.to),
    },
    invoicesCount: periodInvoices.length,
    invoices: periodInvoices,
  };

  const json = JSON.stringify(data, null, 2);
  const fileName = `Backup_${formatDate(period.from).replace(/\./g, '')}_${formatDate(period.to).replace(/\./g, '')}.json`;
  
  await saveAndShareFile(json, fileName, 'application/json');
}

/**
 * Pomožna funkcija za shranjevanje in deljenje datotek
 */
async function saveAndShareFile(content: string, fileName: string, mimeType: string): Promise<void> {
  try {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: fileName,
      });
    }
  } catch (error) {
    console.error('Export Error:', error);
    throw new Error('Napaka pri izvozu datoteke');
  }
}
