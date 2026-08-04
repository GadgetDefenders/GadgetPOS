import type { Customer, InventoryItem, Repair } from '../types';
import { isCloudConfigured, requireSupabase } from './supabase';

export type CloudSnapshot = { customers: Customer[]; repairs: Repair[]; inventory: InventoryItem[] };
type TableName = 'customers' | 'repairs' | 'inventory_items';

function toSnakeCaseRecord(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), entry]));
}
function toCamelCaseRecord<T>(value: Record<string, unknown>): T {
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), entry])) as T;
}
async function fetchTable<T>(table: TableName, shopId: string): Promise<T[]> {
  const client = requireSupabase();
  const { data, error } = await client.from(table).select('*').eq('shop_id', shopId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toCamelCaseRecord<T>(row));
}
async function upsertTable(table: TableName, shopId: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return;
  const client = requireSupabase();
  const payload = rows.map((row) => ({ ...toSnakeCaseRecord(row), shop_id: shopId }));
  const { error } = await client.from(table).upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export const cloudRepository = {
  get configured() { return isCloudConfigured(); },
  async loadSnapshot(shopId: string): Promise<CloudSnapshot> {
    const [customers, repairs, inventory] = await Promise.all([
      fetchTable<Customer>('customers', shopId), fetchTable<Repair>('repairs', shopId), fetchTable<InventoryItem>('inventory_items', shopId),
    ]);
    return { customers, repairs, inventory };
  },
  async saveCustomers(shopId: string, customers: Customer[]) { await upsertTable('customers', shopId, customers as unknown as Array<Record<string, unknown>>); },
  async saveRepairs(shopId: string, repairs: Repair[]) { await upsertTable('repairs', shopId, repairs as unknown as Array<Record<string, unknown>>); },
  async saveInventory(shopId: string, inventory: InventoryItem[]) { await upsertTable('inventory_items', shopId, inventory as unknown as Array<Record<string, unknown>>); },
  subscribe(shopId: string, onChange: () => void) {
    const client = requireSupabase();
    const channel = client.channel(`gadgetpos-shop-${shopId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers', filter: `shop_id=eq.${shopId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repairs', filter: `shop_id=eq.${shopId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items', filter: `shop_id=eq.${shopId}` }, onChange)
      .subscribe();
    return () => { void client.removeChannel(channel); };
  },
};
