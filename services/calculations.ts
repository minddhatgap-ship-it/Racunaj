import type { Invoice, InvoiceItem, DashboardStats } from '@/types';

export function calculateInvoiceItem(
  quantity: number,
  pricePerUnit: number,
  ddvRate: number
): { totalWithoutDDV: number; ddvAmount: number; totalWithDDV: number } {
  const totalWithoutDDV = quantity * pricePerUnit;
  const ddvAmount = (totalWithoutDDV * ddvRate) / 100;
  const totalWithDDV = totalWithoutDDV + ddvAmount;
  
  return {
    totalWithoutDDV: Math.round(totalWithoutDDV * 100) / 100,
    ddvAmount: Math.round(ddvAmount * 100) / 100,
    totalWithDDV: Math.round(totalWithDDV * 100) / 100,
  };
}

export function calculateInvoiceTotals(items: InvoiceItem[]): {
  subtotal: number;
  totalDDV: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.totalWithoutDDV, 0);
  const totalDDV = items.reduce((sum, item) => sum + item.ddvAmount, 0);
  const total = items.reduce((sum, item) => sum + item.totalWithDDV, 0);
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalDDV: Math.round(totalDDV * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

export function getDashboardStats(invoices: Invoice[]): DashboardStats {
  const now = Date.now();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const totalInvoices = invoices.filter(inv => inv.type === 'invoice').length;
  const totalRevenue = invoices
    .filter(inv => inv.type === 'invoice' && inv.isPaid)
    .reduce((sum, inv) => sum + inv.total, 0);
  
  const unpaidInvoices = invoices.filter(
    inv => inv.type === 'invoice' && !inv.isPaid
  );
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  
  const monthlyRevenue = invoices
    .filter(inv => {
      const invDate = new Date(inv.issueDate);
      return (
        inv.type === 'invoice' &&
        inv.isPaid &&
        invDate.getMonth() === currentMonth &&
        invDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, inv) => sum + inv.total, 0);
  
  const totalDDV = invoices
    .filter(inv => inv.type === 'invoice' && inv.isPaid)
    .reduce((sum, inv) => sum + inv.totalDDV, 0);
  
  return {
    totalInvoices,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    unpaidInvoices: unpaidInvoices.length,
    unpaidAmount: Math.round(unpaidAmount * 100) / 100,
    monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
    totalDDV: Math.round(totalDDV * 100) / 100,
  };
}

export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} €`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
