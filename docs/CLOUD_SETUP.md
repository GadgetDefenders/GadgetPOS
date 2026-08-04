# GadgetPOS Cloud Setup

The Supabase project URL is already configured in `src/cloud/supabase.ts`.

## 1. Add the publishable key locally

Create a file named `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://opktwcgugnzbxeuxvggc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=PASTE_YOUR_PUBLISHABLE_KEY_HERE
```

Do not commit `.env.local`. It is excluded by `.gitignore`.

## 2. Create the database tables

In Supabase, open **SQL Editor**, create a new query, paste the entire contents of:

`supabase/migrations/001_initial_schema.sql`

Then click **Run**.

## 3. Enable authentication

In Supabase, open **Authentication → Providers** and keep Email enabled. GadgetPOS supports:

- Email/password sign-up
- Email/password sign-in
- Password-reset email
- Persistent sessions

## 4. Start GadgetPOS

```bash
npm install
npm run dev
```

Local browser storage remains available as a fallback until the user signs in and joins a shop.

## Security

Never use the Supabase service-role key in the browser application. GadgetPOS uses only the publishable key and Row Level Security.
