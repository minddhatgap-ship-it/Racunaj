import type { Invoice, CompanySettings } from '@/types';
import { formatCurrency, formatDate } from './calculations';
import type { FursData } from './furs';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * PDF Export Service
 * Generira profesionalne PDF račune z vsemi potrebnimi podatki
 */

export async function generateInvoicePDF(
  invoice: Invoice,
  company: CompanySettings,
  fursData?: FursData
): Promise<void> {
  const html = generateInvoiceHTML(invoice, company, fursData);
  
  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    // Deli ali shrani PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Račun ${invoice.invoiceNumber}`,
        UTI: 'com.adobe.pdf',
      });
    }
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Napaka pri generiranju PDF-ja');
  }
}

function generateInvoiceHTML(
  invoice: Invoice,
  company: CompanySettings,
  fursData?: FursData
): string {
  const documentTitle = getDocumentTitle(invoice.type);
  const paymentInfo = getPaymentInfo(invoice, company);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle} ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 20mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      border-bottom: 3px solid #FF6B35;
      padding-bottom: 20px;
    }
    .company-info { flex: 1; }
    .company-name {
      font-size: 18pt;
      font-weight: bold;
      color: #FF6B35;
      margin-bottom: 8px;
    }
    .company-details { font-size: 9pt; line-height: 1.6; }
    .invoice-title {
      text-align: right;
      flex: 1;
    }
    .doc-type {
      font-size: 24pt;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 12pt;
      color: #666;
    }
    .parties {
      display: flex;
      justify-content: space-between;
      margin: 30px 0;
      gap: 40px;
    }
    .party {
      flex: 1;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }
    .party-title {
      font-size: 10pt;
      font-weight: bold;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .party-name {
      font-size: 11pt;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .party-details { font-size: 9pt; color: #444; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    thead {
      background: #004E89;
      color: white;
    }
    th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 9pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    tbody tr { border-bottom: 1px solid #e0e0e0; }
    tbody tr:nth-child(even) { background: #f8f9fa; }
    td {
      padding: 10px 8px;
      font-size: 9pt;
    }
    .item-name { font-weight: 600; }
    .item-desc {
      font-size: 8pt;
      color: #666;
      margin-top: 3px;
    }
    .totals {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-table {
      width: 300px;
    }
    .totals-table td {
      padding: 8px 12px;
      border: none;
    }
    .totals-label {
      text-align: right;
      font-weight: 500;
      color: #666;
    }
    .totals-value {
      text-align: right;
      font-weight: 600;
    }
    .total-final {
      background: #FF6B35;
      color: white;
      font-size: 12pt;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      font-size: 8pt;
      color: #666;
    }
    .payment-info {
      background: #fff3cd;
      padding: 15px;
      border-left: 4px solid #ffc107;
      margin: 20px 0;
      border-radius: 4px;
    }
    .payment-title {
      font-weight: bold;
      margin-bottom: 8px;
      color: #856404;
    }
    .furs-section {
      background: #d4edda;
      padding: 15px;
      border-left: 4px solid #28a745;
      margin: 20px 0;
      border-radius: 4px;
    }
    .furs-title {
      font-weight: bold;
      color: #155724;
      margin-bottom: 10px;
    }
    .furs-code {
      font-family: 'Courier New', monospace;
      font-size: 9pt;
      background: white;
      padding: 8px;
      border-radius: 4px;
      margin: 5px 0;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      <div class="company-name">${company.name}</div>
      <div class="company-details">
        ${company.owner}<br>
        ${company.address}<br>
        ${company.postalCode} ${company.city}<br>
        Davčna št.: ${company.taxNumber}<br>
        ${company.phone ? `Tel: ${company.phone}<br>` : ''}
        ${company.email ? `E-pošta: ${company.email}<br>` : ''}
        ${company.iban ? `IBAN: ${company.iban}` : ''}
      </div>
    </div>
    <div class="invoice-title">
      <div class="doc-type">${documentTitle}</div>
      <div class="invoice-number">Številka: ${invoice.invoiceNumber}</div>
      <div class="invoice-number">Datum: ${formatDate(invoice.issueDate)}</div>
      ${invoice.type === 'invoice' ? `<div class="invoice-number">Rok plačila: ${formatDate(invoice.dueDate)}</div>` : ''}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-title">Izdajatelj</div>
      <div class="party-name">${company.name}</div>
      <div class="party-details">
        ${company.address}<br>
        ${company.postalCode} ${company.city}<br>
        Davčna št.: ${company.taxNumber}
      </div>
    </div>
    <div class="party">
      <div class="party-title">Prejemnik</div>
      <div class="party-name">${invoice.clientData.name}</div>
      <div class="party-details">
        ${invoice.clientData.type === 'company' ? `
          ${invoice.clientData.address}<br>
          ${invoice.clientData.postalCode} ${invoice.clientData.city}<br>
          ${invoice.clientData.taxNumber ? `Davčna št.: ${invoice.clientData.taxNumber}` : ''}
        ` : 'Fizična oseba'}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%">#</th>
        <th style="width: 35%">Naziv</th>
        <th class="center" style="width: 10%">Količina</th>
        <th class="right" style="width: 12%">Cena/enota</th>
        <th class="center" style="width: 8%">DDV</th>
        <th class="right" style="width: 15%">Osnova</th>
        <th class="right" style="width: 15%">Skupaj</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.items.map((item, index) => `
        <tr>
          <td class="center">${index + 1}</td>
          <td>
            <div class="item-name">${item.serviceName}</div>
            ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
          </td>
          <td class="center">${item.quantity} ${item.unit}</td>
          <td class="right">${formatCurrency(item.pricePerUnit)}</td>
          <td class="center">${item.ddvRate}%</td>
          <td class="right">${formatCurrency(item.totalWithoutDDV)}</td>
          <td class="right">${formatCurrency(item.totalWithDDV)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td class="totals-label">Skupaj brez DDV:</td>
        <td class="totals-value">${formatCurrency(invoice.subtotal)}</td>
      </tr>
      <tr>
        <td class="totals-label">DDV:</td>
        <td class="totals-value">${formatCurrency(invoice.totalDDV)}</td>
      </tr>
      <tr class="total-final">
        <td class="totals-label">SKUPAJ ZA PLAČILO:</td>
        <td class="totals-value">${formatCurrency(invoice.total)}</td>
      </tr>
    </table>
  </div>

  ${invoice.type === 'invoice' ? paymentInfo : ''}

  ${fursData ? `
    <div class="furs-section">
      <div class="furs-title">🔒 FURS Davčno potrjen račun</div>
      <div style="font-size: 8pt; margin-bottom: 10px;">
        Ta račun je davčno potrjen v skladu z Zakonom o davčnem postopku (ZDavP-2).
      </div>
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <strong>ZOI (Zaščitena oznaka):</strong>
          <div class="furs-code">${fursData.zoi}</div>
          <strong>EOR (Enolična oznaka):</strong>
          <div class="furs-code">${fursData.eor}</div>
        </div>
        <div style="flex: 1;">
          <strong>Preverjanje veljavnosti:</strong>
          <div style="font-size: 8pt; margin-top: 5px;">
            Račun lahko preverite na:<br>
            <a href="https://blagajne.fu.gov.si/">blagajne.fu.gov.si</a>
          </div>
          <div style="margin-top: 10px; text-align: center;">
            <div style="width: 100px; height: 100px; background: white; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
              QR koda
            </div>
            <div style="font-size: 7pt; color: #666; margin-top: 5px;">
              Skenirajte za preverjanje
            </div>
          </div>
        </div>
      </div>
    </div>
  ` : ''}

  ${invoice.notes ? `
    <div class="payment-info">
      <div class="payment-title">Opombe:</div>
      ${invoice.notes}
    </div>
  ` : ''}

  <div class="footer">
    <div style="text-align: center;">
      Hvala za poslovanje! | ${company.email || ''} | ${company.phone || ''}
    </div>
  </div>
</body>
</html>
  `;
}

function getDocumentTitle(type: string): string {
  switch (type) {
    case 'invoice': return 'RAČUN';
    case 'proforma': return 'PREDRAČUN';
    case 'delivery_note': return 'DOBAVNICA';
    case 'quote': return 'PONUDBA';
    default: return 'DOKUMENT';
  }
}

function getPaymentInfo(invoice: Invoice, company: CompanySettings): string {
  return `
    <div class="payment-info">
      <div class="payment-title">Način plačila: ${invoice.paymentMethod}</div>
      ${company.iban ? `
        <div style="margin-top: 8px;">
          <strong>Prejemnik:</strong> ${company.name}<br>
          <strong>IBAN:</strong> ${company.iban}<br>
          ${company.bic ? `<strong>BIC:</strong> ${company.bic}<br>` : ''}
          <strong>Namen:</strong> Plačilo računa ${invoice.invoiceNumber}<br>
          <strong>Referenca:</strong> SI00 ${invoice.invoiceNumber.replace(/\D/g, '')}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Tiskanje računa (za Bluetooth tiskalnike)
 */
export async function printInvoice(
  invoice: Invoice,
  company: CompanySettings,
  fursData?: FursData
): Promise<void> {
  const html = generateInvoiceHTML(invoice, company, fursData);
  
  try {
    await Print.printAsync({ html });
  } catch (error) {
    console.error('Print Error:', error);
    throw new Error('Napaka pri tiskanju');
  }
}
