import type { Customer, InventoryItem, Repair } from './types';

const KEYS = {
  customers: 'gadgetpos_customers_v1',
  repairs: 'gadgetpos_repairs_v1',
  inventory: 'gadgetpos_inventory_v1',
};

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
}

function write<T>(key: string, values: T[]): void {
  localStorage.setItem(key, JSON.stringify(values));
}

export const storage = {
  getCustomers: () => read<Customer>(KEYS.customers),
  saveCustomers: (values: Customer[]) => write(KEYS.customers, values),
  getRepairs: () => read<Repair>(KEYS.repairs),
  saveRepairs: (values: Repair[]) => write(KEYS.repairs, values),
  getInventory: () => read<InventoryItem>(KEYS.inventory),
  saveInventory: (values: InventoryItem[]) => write(KEYS.inventory, values),
};
