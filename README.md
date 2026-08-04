# GadgetPOS

GadgetPOS is a repair-shop management and point-of-sale system for customer check-in, repair tracking, inventory, checkout, reporting, and printing.

## Status

Developer Preview 0.3 — customer check-in plus Supabase cloud foundation.

## Run locally

```bash
npm install
npm run dev
```

The app continues to use local browser storage until cloud settings are added.

## Enable Supabase cloud storage

1. Create a Supabase project.
2. Run `supabase/migrations/0001_gadgetpos_core.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env`.
4. Add the project URL and publishable key.
5. Create a shop record and add each authenticated user to `shop_members`.

The schema uses Row Level Security so authenticated users only access shops where they are members. Customers, repairs, inventory, and realtime subscriptions are separated by `shop_id`.

## Cloud design

- Local-first operation for speed and temporary internet outages
- Supabase PostgreSQL cloud database
- Supabase Auth-ready user sessions
- Row Level Security for multi-shop privacy
- Realtime-ready customer, repair, and inventory tables
- Local cache retained as a fallback

## Current modules

- Dashboard
- Customer creation and editing
- Searchable repair check-in
- Repair Board
- Inventory foundation
- POS placeholder
- Settings placeholder
- Cloud synchronization foundation

## Next

- Cloud login and shop selection
- Automatic local/cloud synchronization in the interface
- Full repair ticket editing
- Repair timeline and customer history workspace
