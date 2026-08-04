import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://opktwcgugnzbxeuxvggc.supabase.co';
const CONFIG_KEY = 'gadgetpos_cloud_config';

type CloudConfig = { url: string; publishableKey: string };
let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';

export function getCloudConfig(): CloudConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') as Partial<CloudConfig>;
  return {
    url: envUrl || saved.url || DEFAULT_URL,
    publishableKey: envKey || saved.publishableKey || '',
  };
}

export function saveCloudConfig(config: CloudConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  cachedClient = null;
  cachedSignature = '';
}

export function isCloudConfigured() {
  const config = getCloudConfig();
  return Boolean(config.url && config.publishableKey);
}

export function getSupabase(): SupabaseClient | null {
  const config = getCloudConfig();
  if (!config.url || !config.publishableKey) return null;
  const signature = `${config.url}|${config.publishableKey}`;
  if (!cachedClient || cachedSignature !== signature) {
    cachedClient = createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    cachedSignature = signature;
  }
  return cachedClient;
}

export function requireSupabase() {
  const client = getSupabase();
  if (!client) throw new Error('Cloud sync is not configured. Add the Supabase publishable key in Settings.');
  return client;
}
