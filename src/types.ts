export type RepairStatus =
  | 'Checked In'
  | 'Diagnosing'
  | 'Waiting on Parts'
  | 'Repairing'
  | 'Quality Check'
  | 'Ready for Pickup'
  | 'Completed';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
}

export interface Repair {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  brand: string;
  model: string;
  issue: string;
  status: RepairStatus;
  technician?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  estimate: number;
  createdAt: string;
  dueDate?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  model?: string;
  sku?: string;
  quantity: number;
  minimum: number;
  cost: number;
  price: number;
}
