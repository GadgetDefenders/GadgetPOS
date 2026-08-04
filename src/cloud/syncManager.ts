import { cloudRepository } from './cloudRepository';
import { storage } from '../storage';
import type { Customer, InventoryItem, Repair } from '../types';

export type SyncState = 'local-only' | 'syncing' | 'synced' | 'error';

export async function loadCloudOrLocal(shopId?: string) {
  if (!shopId || !cloudRepository.configured) {
    return {
      source: 'local' as const,
      customers: storage.getCustomers(),
      repairs: storage.getRepairs(),
      inventory: storage.getInventory(),
    };
  }

  const cloud = await cloudRepository.loadSnapshot(shopId);
  storage.saveCustomers(cloud.customers);
  storage.saveRepairs(cloud.repairs);
  storage.saveInventory(cloud.inventory);
  return { source: 'cloud' as const, ...cloud };
}

export async function syncAll(
  shopId: string,
  data: { customers: Customer[]; repairs: Repair[]; inventory: InventoryItem[] },
) {
  if (!cloudRepository.configured) return 'local-only' as const;
  await Promise.all([
    cloudRepository.saveCustomers(shopId, data.customers),
    cloudRepository.saveRepairs(shopId, data.repairs),
    cloudRepository.saveInventory(shopId, data.inventory),
  ]);
  return 'synced' as const;
}
