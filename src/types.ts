export type RepairStatus =
  | 'Checked In'
  | 'Diagnosing'
  | 'Waiting on Parts'
  | 'Repairing'
  | 'Quality Check'
  | 'Ready for Pickup'
  | 'Completed';

export type InventoryCategory = 'Phone' | 'Accessory' | 'Prepaid Service' | 'Repair Part';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
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
  color?: string;
  serial?: string;
  passcode?: string;
  issue: string;
  part?: string;
  status: RepairStatus;
  technician?: string;
  priority: 'Normal' | 'High' | 'Urgent';
  estimate: number;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string;
  notes?: string;
}

export interface RepairTimelineEntry {
  id: string;
  repairId: string;
  action: string;
  notes?: string;
  employee: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  category: InventoryCategory;
  name: string;
  brand?: string;
  model?: string;
  sku?: string;
  barcode?: string;
  imei?: string;
  serial?: string;
  carrier?: string;
  storage?: string;
  color?: string;
  condition?: 'New' | 'Like New' | 'Good' | 'Fair' | 'For Parts';
  batteryHealth?: number;
  quantity: number;
  minimum: number;
  cost: number;
  price: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
