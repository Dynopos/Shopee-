# Shopee AI Listing Assistant

AI-powered product listing generator for Shopee sellers. Upload a product photo, let GPT-4o write the listing, review it, then publish directly to your Shopee shop via the Open Platform API.

## Features

- Email/password auth via Supabase
- Shopee OAuth 2.0 seller account connection
- Drag-and-drop product image upload
- GPT-4o vision analysis — generates title, description, SEO keywords, category, price, stock, highlights
- Editable preview before publishing
- One-click upload to Shopee (image + product listing)
- Auto token refresh
- Upload audit logs
- Dashboard with live/draft/failed stats

## Pages

| Route | Description |
|---|---|
| `/login` | Sign in / sign up |
| `/dashboard` | Product stats and recent listings |
| `/upload` | Drag & drop image upload + AI generation |
| `/preview` | Edit AI-generated fields and publish |
| `/connect-shopee` | Shopee OAuth connection flow |
| `/settings` | Account info and config |

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS**
- **Supabase** — auth, PostgreSQL, storage
- **OpenAI GPT-4o** — vision-based listing generation
- **Shopee Open Platform API v2**

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd shopee-ai-listing
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `SHOPEE_PARTNER_ID` | Shopee Open Platform → My Apps |
| `SHOPEE_PARTNER_KEY` | Shopee Open Platform → My Apps |
| `SHOPEE_REDIRECT_URL` | Must match redirect URL registered in Shopee app |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for local dev |

### 3. Supabase database

Run the migration in the Supabase SQL editor or CLI:

```bash
# Using Supabase CLI
supabase db push

# Or paste supabase/migrations/001_initial_schema.sql into the SQL editor
```

The migration creates:
- `users`, `shopee_accounts`, `products`, `ai_generated_listings`, `upload_logs` tables
- Row-level security policies
- A `product-images` storage bucket
- A trigger that auto-creates a user profile on signup

### 4. Supabase Auth

In the Supabase dashboard → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/api/auth/callback`

### 5. Shopee Open Platform

1. Register at [open.shopee.com](https://open.shopee.com)
2. Create an app and note your **Partner ID** and **Partner Key**
3. Set the redirect URL to: `http://localhost:3000/api/shopee/callback`
4. For sandbox testing, use `https://partner.test-stable.shopeemobile.com`

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
