# Ownexa Backend

This backend is the API and persistence layer for Ownexa. It is built with Express, uses Supabase for authentication and database/storage access, and coordinates the off-chain workflows for users, properties, holdings, listings, transactions, and analytics.

The backend does not execute blockchain transactions itself. Instead, the frontend interacts with the smart contract through MetaMask and then calls backend endpoints to persist the off-chain state that the platform needs for dashboards, listings, analytics, and admin workflows.

## Responsibilities

The backend is responsible for:

- user signup and login integration with Supabase Auth
- storing and returning user profile metadata
- reading the active session from a secure cookie
- accepting property submissions and uploading files to Supabase Storage
- managing admin validation, warning, and freeze workflows
- recording primary and secondary transactions after on-chain execution
- maintaining holdings and listings state
- exposing public and admin analytics
- triggering the ML API during signup so a user risk label is stored

## Stack

- Node.js
- Express 5
- `@supabase/supabase-js`
- `cookie-parser`
- `cors`
- `multer`
- external ML service at `http://127.0.0.1:8000`

## Project Structure

```text
Backend/
├── Database/
│   ├── Analytics/
│   ├── Investments/
│   ├── Listings/
│   ├── Property/
│   ├── Transactions/
│   ├── Users/
│   ├── SupabaseAuthClient.js
│   └── SupabaseClient.js
├── Middleware/
│   └── Middleware.js
├── Routes/
│   ├── Analytics/
│   ├── Authentication/
│   ├── Holdings/
│   ├── Listings/
│   ├── Property/
│   └── Transactions/
├── package.json
└── server.js
```

## Runtime Overview

The app is bootstrapped in [`server.js`](/Users/dhruv/Blockchain/Ownexa/Backend/server.js).

Important runtime behavior:

- Express listens on `process.env.PORT` and falls back to `4000` locally
- CORS allows origins from `FRONTEND_ORIGIN`, with `http://localhost:5173` as the local default
- JSON request bodies are enabled
- `cookie-parser` is enabled
- `GET /health` returns a lightweight health check for Render
- all route modules are mounted at `/`

## Authentication Model

Authentication is session-based from the backend’s point of view:

1. The client logs in through `POST /auth/login`.
2. Supabase Auth returns a session.
3. The backend stores `session.access_token` in an `httpOnly` cookie named `sb-access-token`.
4. Protected routes call `getAuthUser(req)` from [`Middleware/Middleware.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Middleware/Middleware.js).
5. `getAuthUser` uses `supabase.auth.getUser(token)` to resolve the authenticated user from the cookie token.

This means the backend trusts Supabase Auth as the source of identity and keeps platform-specific metadata in the `users` table.

## Environment Variables

Create `Backend/.env` with:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_ORIGIN=http://localhost:5173
ML_API_URL=http://127.0.0.1:8000
NODE_ENV=development
```

### Why These Are Needed

- `SUPABASE_URL`: project URL for auth, database, and storage access
- `SUPABASE_ANON_KEY`: used by [`Database/SupabaseAuthClient.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Database/SupabaseAuthClient.js)
- `SUPABASE_SERVICE_ROLE_KEY`: used by [`Database/SupabaseClient.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Database/SupabaseClient.js) for database and storage operations
- `FRONTEND_ORIGIN`: comma-separated allowed frontend origins for credentialed CORS
- `ML_API_URL`: base URL of the ML API used during signup
- `NODE_ENV`: controls production cookie behavior in login/logout routes

## Deploy On Render

The repository includes [`render.yaml`](/Users/dhruv/Blockchain/Ownexa/render.yaml) for a Render Blueprint deployment.

### Blueprint Deployment

1. Push the repository to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Render will create both services from the blueprint:
   - `ownexa-model`: Python FastAPI service from `Model`
   - `ownexa-backend`: Node/Express service from `Backend`
4. Add the secret environment variables when Render asks for them.
5. After `ownexa-model` is live, set `ML_API_URL` on `ownexa-backend` to the model service URL, for example `https://ownexa-model.onrender.com`.

### Manual Render Web Service

If creating the service manually, use:

```text
Runtime: Node
Root Directory: Backend
Build Command: npm ci
Start Command: npm start
Health Check Path: /health
```

Set these Render environment variables:

```env
NODE_ENV=production
FRONTEND_ORIGIN=https://your-frontend-domain.com
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ML_API_URL=https://your-ml-api-domain.com
```

Render provides `PORT` automatically, so do not set it yourself.

For deployed frontend auth, keep frontend requests credentialed, for example `fetch(url, { credentials: "include" })` or `axios` with `withCredentials: true`. In production the backend sets the auth cookie as `SameSite=None; Secure` so it can work between the deployed frontend domain and the Render API domain.

If the ML API is not deployed yet, signup still succeeds; the backend logs the ML error and continues.

## Install And Run

Install dependencies:

```bash
cd Backend
npm install
```

Start in development:

```bash
npm run dev
```

Start in production mode:

```bash
npm start
```

Default local API base:

```text
http://localhost:4000
```

## Backend Architecture

The backend follows a light service separation:

- `Routes/` contains Express route definitions and request validation
- `Database/` contains the Supabase queries and write operations
- `Middleware/` contains shared auth and upload helpers

This is not a full domain-service architecture, but it does keep route handlers smaller and isolates most database logic from HTTP wiring.

## Route Reference

### Authentication Routes

Defined in [`Routes/Authentication/Auth.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Routes/Authentication/Auth.js)

#### `POST /auth/signup`

Creates a Supabase Auth user, inserts a row into `users`, and triggers the ML API.

Expected request body:

```json
{
  "Email": "user@example.com",
  "Password": "secret",
  "Username": "dhruv",
  "Avatar": "https://...",
  "age": 24,
  "investment_amount": 150000,
  "investment_duration": 12,
  "annual_income": 1200000
}
```

Behavior:

- creates user in Supabase Auth
- inserts platform profile into `users`
- calls `PUT http://127.0.0.1:8000/recommend`
- does not auto-login the user

#### `POST /auth/login`

Logs in through Supabase Auth and sets the cookie:

- cookie name: `sb-access-token`
- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` only when `NODE_ENV === "production"`

Expected request body:

```json
{
  "Email": "user@example.com",
  "Password": "secret"
}
```

#### `GET /auth/logout`

Clears the `sb-access-token` cookie.

#### `GET /auth/me`

Returns the authenticated user profile by:

- reading the access token from cookie
- resolving the auth user with Supabase
- fetching the platform row from `users`

Response shape:

```json
{
  "loggedIn": true,
  "user": {
    "email": "user@example.com",
    "username": "dhruv",
    "created_at": "2026-04-17T12:00:00.000Z",
    "avatar": "https://...",
    "role": "User",
    "risk_label": 1
  }
}
```

### Property Routes

Defined in:

- [`Routes/Property/FetchingProperty.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Routes/Property/FetchingProperty.js)
- [`Routes/Property/UpdatingProperty.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Routes/Property/UpdatingProperty.js)

#### `POST /property/add`

Protected route. Accepts multipart form data and uploads:

- `propertyImages` up to 10 files
- `legalDocuments` up to 10 files

Stored through Supabase Storage buckets:

- `Property-Images`
- `Legal-Documents`

Request fields used by the backend:

- `ownerName`
- `accountaddress`
- `title`
- `bhk`
- `propertyType`
- `builtUpAreaSqFt`
- `addressLine`
- `city`
- `state`
- `pincode`
- `country` optional, defaults to `India`
- `registryName`
- `registryNumber`
- `registrationDate`
- `expectedPriceInr`
- `tokenName`

Creates a row in `properties` with initial state:

- `status: "pending"`
- `blockchain_id: null`
- `last_doc_uploaded_at: now`

#### `PUT /property/validate`

Admin-only route. Marks a property as validated/listed/tokenized according to the supplied payload.

Expected fields used:

- `propertyId`
- `launchedPriceINR`
- `pricePerTokenINR`
- `tokenName`
- `tokenQuantity`
- `tokenization`
- `transactionHash`
- `blockchainId`
- `adminreview`
- `status`
- `listing`

Updates fields such as:

- `launched_price_inr`
- `price_per_token_inr`
- `token_name`
- `initial_token_quantity`
- `token_quantity`
- `is_tokenized`
- `transaction_hash`
- `blockchain_id`
- `validated_by`
- `validated_at`
- `admin_review`
- `status`
- `is_listed`

#### `PUT /property/warn`

Admin-only route. Updates:

- `admin_review`
- `updated_at`

This route currently records review feedback but does not apply a separate warning enum itself.

#### `PUT /property/freeze`

Admin-only route. Updates:

- `admin_review`
- `updated_at`
- `status: "FROZEN"`
- `is_listed: false`

#### `PUT /property/sold`

Protected route. Calls property freeze logic after a sale/settlement-style flow and:

- sets `properties.is_listed = false`
- sets `holdings.holding_status = false` for holdings linked to that property

#### `GET /properties?status=...&listed=...`

Filters `properties` by:

- `status`
- `is_listed`

#### `GET /properties/:id?status=...&listed=...`

Returns a single property filtered by:

- `id`
- `status`
- `is_listed`

#### `GET /userproperties`

Returns all properties where:

- `owner_id = auth user id`

#### `GET /warnedproperties`

Admin-only route that returns validated properties whose documents are stale according to:

- `status = "Validated"`
- `last_doc_uploaded_at` older than a configured cutoff
- or `last_doc_uploaded_at IS NULL`

### Transaction Routes

Defined in [`Routes/Transactions/PrimaryTransactions.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Routes/Transactions/PrimaryTransactions.js)

#### `POST /transaction?type=primary|secondary`

Protected route. Persists a completed transaction and updates related state.

Expected payload fields used:

- `propertyId`
- `accountaddress`
- `tokenQuantity`
- `tokenName`
- `pricePerTokenInr`
- `transactionhash`
- `status`
- `listingId` for secondary flow

Flow:

1. insert into `primary_transactions`
2. upsert/update `holdings`
3. if `type=primary`, reduce property `token_quantity`
4. if `type=secondary`, mark listing as `SOLD`

#### `GET /transaction?status=SUCCESS|FAILED`

Protected route. Returns the current user’s transactions joined to property metadata.

### Holdings Routes

Defined in [`Routes/Holdings/Holding.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Routes/Holdings/Holding.js)

#### `GET /holdings`

Protected route. Returns user holdings joined to related property data.

#### `PUT /holding/freeze`

Protected route. Marks a holding as:

- `redeemed = true`
- `holding_status = false`

This is effectively the backend-side state transition for redeemed/closed holdings.

### Listing Routes

Defined in [`Routes/Listings/Listing.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Routes/Listings/Listing.js)

#### `POST /listing`

Protected route. Creates a listing and reduces the source holding quantity.

Expected payload fields used:

- `propertyId`
- `holdingId`
- `tokenQuantity`
- `pricePerTokenInr`
- `listingBlockchainId`

Writes:

- insert into `listings`
- update `holdings` to reduce quantity or disable row if quantity becomes zero

#### `GET /listings?tag=buyer|seller&status=...`

Protected route.

- `tag=seller`: returns seller-side listing view joined with `properties` and `holdings`
- `tag=buyer`: returns buyer-side listing records filtered by `buyer_id`

#### `GET /propertylisting`

Returns all listings filtered by `status`, joined to property metadata.

#### `GET /propertylisting/:id`

Returns active listings for a single property.

#### `POST /cancellisting`

Protected route. Marks a listing as cancelled and restores quantity to holdings.

Current flow:

1. update listing status to `CANCELLED`
2. call holdings upsert logic to add tokens back

### Analytics Routes

Defined in [`Routes/Analytics/Analytics.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Routes/Analytics/Analytics.js)

#### `GET /public/stats`

Returns summarized public counters from `platform_stats`:

- total users
- total validated properties
- total transactions
- total transaction volume

#### `GET /admin/stats?days=7|14|30|90`

Admin-only route. Returns day-level analytics rows from `transaction_analytics`.

## Supabase Schema

There are no SQL migrations in this repository, so the schema below is inferred directly from the backend code. It documents the fields the backend currently expects to exist.

If you build migrations from this README, treat the schema as the backend contract.

## Tables

### 1. `users`

Stores application profile data keyed by the Supabase Auth user id.

#### Required columns inferred from code

| Column | Suggested Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, should match `auth.users.id` |
| `email` | `text` | Stored at signup |
| `username` | `text` | Display/user name |
| `avatar` | `text` | Public image URL |
| `role` | `text` | Used for route authorization, values include `User`, `Admin` |
| `age` | `integer` | Used by ML flow |
| `income` | `numeric` | Used by ML flow |
| `investment_amount` | `numeric` | Used by ML flow |
| `investment_duration` | `integer` | Used by ML flow |
| `risk_label` | `integer` | Set by ML API |
| `created_at` | `timestamptz` | Read in `/auth/me` |

#### Used by backend for

- auth profile lookup
- role checks
- ML-backed risk profiling

### 2. `properties`

Stores submitted and validated property records.

#### Required columns inferred from code

| Column | Suggested Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `owner_id` | `uuid` | FK to `users.id` |
| `owner_email` | `text` | copied from auth user |
| `owner_name` | `text` | submitted in form |
| `owner_accountaddress` | `text` | wallet used for on-chain ownership |
| `title` | `text` | property title |
| `bhk` | `text` | bedroom descriptor |
| `property_type` | `text` | apartment, villa, etc. |
| `built_up_area_sqft` | `numeric` | form input |
| `address_line` | `text` | street/locality |
| `city` | `text` | city |
| `state` | `text` | state |
| `pincode` | `text` | postal code |
| `country` | `text` | defaults to `India` in code |
| `registry_name` | `text` | legal metadata |
| `registry_number` | `text` | legal metadata |
| `registration_date` | `date` or `timestamptz` | user-entered |
| `launched_price_inr` | `numeric` | set during validation |
| `price_per_token_inr` | `numeric` | initial submission + validation |
| `token_name` | `text` | token symbol/display name |
| `initial_token_quantity` | `integer` | set at validation |
| `token_quantity` | `integer` | decremented as tokens are sold |
| `is_tokenized` | `boolean` | set during validation |
| `transaction_hash` | `text` | chain tx hash for tokenization/listing phase |
| `blockchain_id` | `bigint` or `integer` | on-chain property token id |
| `property_images` | `text[]` or `jsonb` | list of public URLs |
| `legal_documents` | `text[]` or `jsonb` | list of public URLs |
| `status` | `text` | values seen include `pending`, `Validated`, `FROZEN` |
| `admin_review` | `text` | review message/comments |
| `validated_by` | `uuid` | admin user id |
| `validated_at` | `timestamptz` | validation timestamp |
| `is_listed` | `boolean` | market visibility |
| `last_doc_uploaded_at` | `timestamptz` | used for stale-doc checks |
| `created_at` | `timestamptz` | recommended |
| `updated_at` | `timestamptz` | recommended |

#### Used by backend for

- market inventory
- owner dashboard
- admin review
- token inventory tracking
- listing visibility

### 3. `holdings`

Stores token ownership state per user, property, and wallet.

#### Required columns inferred from code

| Column | Suggested Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK to `users.id` |
| `wallet_address` | `text` | lowercased in code |
| `property_id` | `uuid` | FK to `properties.id` |
| `token_quantity` | `integer` | current quantity held |
| `avg_price_inr` | `numeric` | weighted average buy price |
| `holding_status` | `boolean` | active/inactive holding row |
| `redeemed` | `boolean` | set true when redeemed/frozen |
| `updated_at` | `timestamptz` | tracked in code |
| `created_at` | `timestamptz` | recommended |

#### Uniqueness the code expects

The upsert logic uses:

```text
onConflict: wallet_address,property_id
```

In practice, because queries also filter by `user_id`, the safest database rule is a unique constraint on:

```text
(user_id, wallet_address, property_id)
```

That better matches the actual ownership model.

#### Used by backend for

- investor portfolio
- quantity reduction when listing
- quantity increase when buying or cancelling a listing
- redemption lifecycle

### 4. `listings`

Stores secondary market listings.

#### Required columns inferred from code

| Column | Suggested Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `property_id` | `uuid` | FK to `properties.id` |
| `seller_id` | `uuid` | FK to `users.id` |
| `holding_id` | `uuid` | FK to `holdings.id` |
| `token_quantity` | `integer` | tokens offered |
| `price_per_token_inr` | `numeric` | ask price |
| `listing_blockchain_id` | `bigint` or `integer` | on-chain listing id |
| `buyer_id` | `uuid` nullable | FK to `users.id` |
| `transaction_hash` | `text` nullable | set when sold |
| `status` | `text` | values seen include `ACTIVE`, `SOLD`, `CANCELLED` |
| `created_at` | `timestamptz` | used in responses |
| `updated_at` | `timestamptz` | used for ordering and status updates |

#### Used by backend for

- property resale inventory
- seller listing history
- buyer listing history
- linking secondary sale records to holdings and transactions

### 5. `primary_transactions`

Despite the table name, this table stores both primary and secondary transaction rows using the `type` field.

#### Required columns inferred from code

| Column | Suggested Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `property_id` | `uuid` | FK to `properties.id` |
| `buyer_id` | `uuid` | FK to `users.id` |
| `buyer_address` | `text` | lowercased wallet address |
| `token_quantity` | `integer` | quantity purchased |
| `token_name` | `text` | copied from property/listing |
| `price_per_token_inr` | `numeric` | execution price |
| `transaction_hash` | `text` | blockchain tx hash |
| `status` | `text` | values include `SUCCESS`, `FAILED` |
| `type` | `text` | values include `primary`, `secondary` |
| `created_at` | `timestamptz` | used for ordering |

#### Used by backend for

- user transaction history
- analytics rollups

### 6. `platform_stats`

Stores a single-row public statistics snapshot.

#### Required columns inferred from code

| Column | Suggested Type | Notes |
|---|---|---|
| `total_users` | `integer` | public stat |
| `total_validated_properties` | `integer` | public stat |
| `total_transactions` | `integer` | public stat |
| `total_transaction_volume` | `numeric` | public stat |

The backend uses `.single()`, so it expects exactly one row.

### 7. `transaction_analytics`

Stores pre-aggregated day-level metrics for the admin dashboard.

#### Required columns inferred from code

| Column | Suggested Type | Notes |
|---|---|---|
| `day` | `date` | filter key |
| `tx_count` | `integer` | transactions per day |
| `volume_inr` | `numeric` | daily notional volume |

## Suggested Relationships

These relationships are implied by the join queries in the backend:

- `properties.owner_id -> users.id`
- `properties.validated_by -> users.id`
- `holdings.user_id -> users.id`
- `holdings.property_id -> properties.id`
- `listings.property_id -> properties.id`
- `listings.seller_id -> users.id`
- `listings.buyer_id -> users.id`
- `listings.holding_id -> holdings.id`
- `primary_transactions.property_id -> properties.id`
- `primary_transactions.buyer_id -> users.id`

## Suggested Storage Buckets

The backend uploads files to these bucket names exactly:

- `Property-Images`
- `Legal-Documents`

The upload helper uses `getPublicUrl`, so bucket/file access must be configured in a way that allows those generated public URLs to work for your frontend and admin views.

## Suggested SQL Blueprint

This is a practical starter schema based on the code expectations. Adjust types as needed for your Supabase conventions.

```sql
create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  username text not null,
  avatar text,
  role text not null default 'User',
  age integer,
  income numeric,
  investment_amount numeric,
  investment_duration integer,
  risk_label integer,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id),
  owner_email text not null,
  owner_name text not null,
  owner_accountaddress text not null,
  title text not null,
  bhk text,
  property_type text,
  built_up_area_sqft numeric,
  address_line text,
  city text,
  state text,
  pincode text,
  country text default 'India',
  registry_name text,
  registry_number text,
  registration_date date,
  launched_price_inr numeric,
  price_per_token_inr numeric,
  token_name text,
  initial_token_quantity integer,
  token_quantity integer,
  is_tokenized boolean default false,
  transaction_hash text,
  blockchain_id bigint,
  property_images text[] default '{}',
  legal_documents text[] default '{}',
  status text not null default 'pending',
  admin_review text,
  validated_by uuid references public.users(id),
  validated_at timestamptz,
  is_listed boolean default false,
  last_doc_uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  wallet_address text not null,
  property_id uuid not null references public.properties(id),
  token_quantity integer not null default 0,
  avg_price_inr numeric not null default 0,
  holding_status boolean not null default true,
  redeemed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, wallet_address, property_id)
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id),
  seller_id uuid not null references public.users(id),
  holding_id uuid not null references public.holdings(id),
  token_quantity integer not null,
  price_per_token_inr numeric not null,
  listing_blockchain_id bigint,
  buyer_id uuid references public.users(id),
  transaction_hash text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.primary_transactions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id),
  buyer_id uuid not null references public.users(id),
  buyer_address text not null,
  token_quantity integer not null,
  token_name text not null,
  price_per_token_inr numeric not null,
  transaction_hash text,
  status text not null,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_stats (
  total_users integer not null default 0,
  total_validated_properties integer not null default 0,
  total_transactions integer not null default 0,
  total_transaction_volume numeric not null default 0
);

create table if not exists public.transaction_analytics (
  day date primary key,
  tx_count integer not null default 0,
  volume_inr numeric not null default 0
);
```

## State Transitions

### Property Lifecycle

Typical lifecycle from the code’s perspective:

1. `pending`
2. validated with admin metadata
3. optionally `is_listed = true`
4. token quantity decreases as users buy
5. property can be frozen or delisted
6. holdings may be disabled after settlement/redemption flows

Observed status values:

- `pending`
- `Validated`
- `FROZEN`

You may want to standardize casing in the future because the code currently uses both lowercase and capitalized values.

### Listing Lifecycle

Observed listing status values:

- `ACTIVE`
- `SOLD`
- `CANCELLED`

Flow:

1. seller creates listing
2. holding quantity decreases
3. listing becomes visible in secondary market
4. buyer purchases or seller cancels
5. sold/cancelled listing is no longer active

### Holding Lifecycle

Holding state is controlled by:

- `token_quantity`
- `holding_status`
- `redeemed`

Typical states:

- active with positive quantity
- inactive with zero quantity after listing full amount
- inactive redeemed after settlement/redemption flow

## Database Access Notes

### Clients

- [`Database/SupabaseClient.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Database/SupabaseClient.js): uses service role key
- [`Database/SupabaseAuthClient.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Database/SupabaseAuthClient.js): uses anon key

At the moment, most backend operations use the service-role-backed client.

### Middleware

[`Middleware/Middleware.js`](/Users/dhruv/Blockchain/Ownexa/Backend/Middleware/Middleware.js) provides:

- `getAuthUser(req)`: auth user resolution from cookie token
- `FindRole(userId)`: role lookup from `users`
- `upload`: multer memory storage with 10 MB per-file limit

## Important Behavioral Notes

- The backend persists state after blockchain actions rather than originating those actions.
- The `primary_transactions` table name is broader than its contents because it stores both primary and secondary rows via a `type` field.
- Cancellation and secondary buy flows depend on client-provided payloads being internally consistent with the blockchain action that already happened.
- The ML service is called during signup, but signup is not blocked if the ML call fails.
- File uploads are stored in memory before being forwarded to Supabase Storage.

## Missing Pieces In The Current Repo

These are important if you plan to productionize the backend:

- no migration files
- no database seed scripts
- no OpenAPI or Swagger spec
- no backend tests
- no background jobs for analytics rollups
- no explicit row-level security policies documented here
- no `.env.example`

## Recommended Next Improvements

- add SQL migrations for the inferred schema
- add enum-like constraints for status fields
- normalize casing for property status values
- add foreign key indexes and filtered indexes
- add request validation with a library like Zod or Joi
- separate service-role and user-scoped database access more strictly
- add automated tests for route and data lifecycle flows
- add RLS policy documentation for Supabase

## Quick Start Checklist

1. Create the Supabase project.
2. Create the tables listed above.
3. Create the storage buckets `Property-Images` and `Legal-Documents`.
4. Add the backend environment variables.
5. Start the ML service on `127.0.0.1:8000`.
6. Run `npm install` in `Backend/`.
7. Run `npm run dev`.
8. Point the frontend `VITE_API_BASE` to `http://localhost:4000`.
