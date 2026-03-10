import React, { createContext, useState, useEffect, ReactNode } from 'react';
import type { Client, Service, Invoice } from '@/types';
import * as storage from '@/services/storage';

interface DataContextType {
  clients: Client[];
  services: Service[];
  invoices: Invoice[];
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'createdAt'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  markInvoiceAsPaid: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [loadedClients, loadedServices, loadedInvoices] = await Promise.all([
        storage.getClients(),
        storage.getServices(),
        storage.getInvoices(),
      ]);
      setClients(loadedClients);
      
      // Initialize with sample products if empty
      if (loadedServices.length === 0) {
        const sampleServices: Service[] = [
          {
            id: '1',
            name: 'Bela majica XL',
            category: 'product',
            description: 'Kakovostna bombažna majica, velikost XL',
            price: 15.99,
            unit: 'kos',
            ddvRate: 22,
            usageCount: 0,
            createdAt: Date.now(),
          },
          {
            id: '2',
            name: 'USB-C polnilec 65W',
            category: 'product',
            description: 'Hitri polnilec za prenosnike in telefone',
            price: 29.99,
            unit: 'kos',
            ddvRate: 22,
            usageCount: 0,
            createdAt: Date.now() + 1,
          },
          {
            id: '3',
            name: 'Računalniška miška',
            category: 'product',
            description: 'Ergonomska brezžična miška',
            price: 24.50,
            unit: 'kos',
            ddvRate: 22,
            usageCount: 0,
            createdAt: Date.now() + 2,
          },
          {
            id: '4',
            name: 'A4 papir 500 listov',
            category: 'product',
            description: 'Pisarniški papir 80g/m²',
            price: 4.99,
            unit: 'paket',
            ddvRate: 22,
            usageCount: 0,
            createdAt: Date.now() + 3,
          },
          {
            id: '5',
            name: 'LED sijalka E27 10W',
            category: 'product',
            description: 'Energetsko varčna sijalka',
            price: 7.99,
            unit: 'kos',
            ddvRate: 22,
            usageCount: 0,
            createdAt: Date.now() + 4,
          },
        ];
        setServices(sampleServices);
        await storage.saveServices(sampleServices);
      } else {
        setServices(loadedServices);
      }
      
      setInvoices(loadedInvoices);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Clients
  async function addClient(clientData: Omit<Client, 'id' | 'createdAt'>) {
    const newClient: Client = {
      ...clientData,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };
    const updated = [...clients, newClient];
    setClients(updated);
    await storage.saveClients(updated);
  }

  async function updateClient(id: string, clientData: Partial<Client>) {
    const updated = clients.map(c => (c.id === id ? { ...c, ...clientData } : c));
    setClients(updated);
    await storage.saveClients(updated);
  }

  async function deleteClient(id: string) {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    await storage.saveClients(updated);
  }

  // Services
  async function addService(serviceData: Omit<Service, 'id' | 'createdAt' | 'usageCount'>) {
    const newService: Service = {
      ...serviceData,
      id: Date.now().toString(),
      usageCount: 0,
      createdAt: Date.now(),
    };
    const updated = [...services, newService];
    setServices(updated);
    await storage.saveServices(updated);
  }

  async function updateService(id: string, serviceData: Partial<Service>) {
    const updated = services.map(s => (s.id === id ? { ...s, ...serviceData } : s));
    setServices(updated);
    await storage.saveServices(updated);
  }

  async function deleteService(id: string) {
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    await storage.saveServices(updated);
  }

  // Invoices
  async function addInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) {
    const invoiceNumber = await storage.getNextInvoiceNumber();
    const newInvoice: Invoice = {
      ...invoiceData,
      id: Date.now().toString(),
      invoiceNumber,
      createdAt: Date.now(),
    };
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    await storage.saveInvoices(updated);
    
    // Increase usage count for services
    const serviceIds = invoiceData.items.map(item => item.serviceId);
    const updatedServices = services.map(s => 
      serviceIds.includes(s.id) ? { ...s, usageCount: s.usageCount + 1 } : s
    );
    setServices(updatedServices);
    await storage.saveServices(updatedServices);
  }

  async function updateInvoice(id: string, invoiceData: Partial<Invoice>) {
    const updated = invoices.map(inv => (inv.id === id ? { ...inv, ...invoiceData } : inv));
    setInvoices(updated);
    await storage.saveInvoices(updated);
  }

  async function deleteInvoice(id: string) {
    const updated = invoices.filter(inv => inv.id !== id);
    setInvoices(updated);
    await storage.saveInvoices(updated);
  }

  async function markInvoiceAsPaid(id: string) {
    const updated = invoices.map(inv =>
      inv.id === id ? { ...inv, isPaid: true, paidAt: Date.now() } : inv
    );
    setInvoices(updated);
    await storage.saveInvoices(updated);
  }

  return (
    <DataContext.Provider
      value={{
        clients,
        services,
        invoices,
        addClient,
        updateClient,
        deleteClient,
        addService,
        updateService,
        deleteService,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        markInvoiceAsPaid,
        isLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
