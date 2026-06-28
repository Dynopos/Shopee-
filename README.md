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
4. For sandbox testing, use `https://partner.test-stable.shopeemobile.com` — change `SHOPEE_BASE_URL` in `lib/shopee/client.ts`

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── ai/generate/        # POST: upload image, call GPT-4o, save draft
│   │   ├── auth/callback/      # Supabase OAuth callback
│   │   ├── products/upload/    # POST: upload image to Shopee, create listing
│   │   └── shopee/
│   │       ├── auth/            # GET: redirect to Shopee OAuth
│   │       ├── callback/        # GET: exchange code for token
│   │       └── refresh/         # POST: refresh access token
│   ├── connect-shopee/
│   ├── dashboard/
│   ├── login/
│   ├── preview/
│   ├── settings/
│   ├── upload/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── layout/Navbar.tsx
├── lib/
│   ├── openai/generate.ts      # GPT-4o vision listing generator
│   ├── shopee/client.ts        # Shopee API: auth, upload, create product
│   └── supabase/
│       ├── client.ts            # Browser client
│       ├── server.ts            # Server component client
│       └── service.ts           # Service role client (API routes)
├── supabase/migrations/
│   └── 001_initial_schema.sql
├── types/index.ts
├── middleware.ts
└── .env.example
```

## Shopee API Notes

All Shopee integration lives in `lib/shopee/client.ts`. Each function has a comment pointing to the exact API docs page.

**Before going live you must:**

1. **Category mapping** — Replace the `PLACEHOLDER_CATEGORY_ID` in `app/api/products/upload/route.ts` with a real leaf category ID from `v2.product.get_category`.
2. **Logistics** — Replace `logistic_id: 1` in `lib/shopee/client.ts` with real channel IDs from `v2.logistics.get_channel_list`.
3. **Shop name** — After OAuth, call `v2.shop.get_shop_info` to get the real shop name and update the record.
4. **Sandbox** — Use `https://partner.test-stable.shopeemobile.com` for testing.

## Environment Variable Reference

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY       # Supabase service role key (server only)
OPENAI_API_KEY                  # OpenAI API key
SHOPEE_PARTNER_ID               # Shopee Open Platform partner ID
SHOPEE_PARTNER_KEY              # Shopee Open Platform partner key
SHOPEE_REDIRECT_URL             # OAuth callback URL
NEXT_PUBLIC_APP_URL             # App base URL (for internal API calls)
```
