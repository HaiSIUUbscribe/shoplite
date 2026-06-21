# ShopLite

ShopLite is a React, Express and MySQL storefront with product management, inventory-safe checkout, order tracking, customer accounts and an admin dashboard.

## Local setup

1. Create the database with `backend/database/schema.sql`.
2. Copy `backend/.env.example` to `backend/.env` and fill in the database credentials, strong independent JWT secrets and OAuth/SMTP settings that you use.
3. Copy `frontend/.env.example` to `frontend/.env`.
4. Start the API:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

5. Start the storefront in another terminal:

   ```powershell
   cd frontend
   npm install
   npm start
   ```

The storefront runs at `http://localhost:3000`; the API health endpoint is `http://localhost:3600/api/health`.

## Tests

Backend tests use Node's built-in test runner; frontend tests use React Scripts:

```powershell
cd backend
npm test

cd ../frontend
npm test -- --watchAll=false
```

## Upgrade an existing database

Back up the database first. For an existing installation, run each migration that has not already been applied, in this order:

1. `backend/database/migration-2026-professional.sql`
2. `backend/database/migration-2026-vnpay.sql`
3. `backend/database/migration-2026-product-variants.sql`
4. `backend/database/migration-2026-newsletter.sql`
5. `backend/database/migration-2026-vouchers.sql`
6. `backend/database/migration-2026-voucher-accounts.sql`
7. `backend/database/migration-2026-cart-reviews.sql`
8. `backend/database/migration-2026-refresh-tokens.sql`
9. `backend/database/migration-2026-accounts-addresses-favorites.sql`
10. `backend/database/migration-2026-notifications.sql`

The cart/review and account/address/favorite migrations align foreign-key columns with the actual primary-key types in the existing database. The account migration also adds account locking and login tracking used by the admin user-management page. Existing products receive a stock value of `0`, so update their inventory in the admin product page after migration.

Migrations are intended to run once. A duplicate-column error usually means that statement was already applied; verify the table with `SHOW CREATE TABLE table_name` instead of rerunning the whole file.

## Deployment

### Backend

Configure these environment variables in Render or the backend host:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `DB_SSL=true` for a managed MySQL provider, or `false` for local MySQL
- `JWT_SECRET` with a long random value, plus `ACCESS_TOKEN_TTL` and `REFRESH_TOKEN_DAYS`
- `JWT_RESET_SECRET` with a different long random value
- `GOOGLE_CLIENT_ID` matching the frontend OAuth client ID when Google login is enabled
- `CLIENT_URL` with comma-separated frontend origins, for example the Vercel production and preview URLs
- `PUBLIC_API_URL` with the public backend origin, used for uploaded image URLs
- `UPLOAD_DIR` pointing to persistent storage in production
- `FRONTEND_URL` for password-reset links
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `SUPPORT_EMAIL` for password reset, contact and order-confirmation email
- `SMS_WEBHOOK_URL`, `SMS_WEBHOOK_TOKEN` and `SMS_SENDER` when an SMS gateway is enabled for urgent admin alerts
- `VNPAY_TMN_CODE`, `VNPAY_SECURE_SECRET`, `VNPAY_HOST` and `VNPAY_TEST_MODE` for VNPay
- `VNPAY_RETURN_URL` with the public backend URL ending in `/api/payments/vnpay/return`

Register `https://your-api-host.example/api/payments/vnpay/ipn` as the IPN URL in the VNPay merchant portal. Both Return and IPN URLs must use HTTPS in production and point to the backend, not Vercel frontend routes.

The notification dispatcher stores in-app messages, sends role-specific email, and optionally POSTs urgent SMS payloads as `{to, message, sender}` to `SMS_WEBHOOK_URL`. Client preferences control in-app and email channels separately. Admins configure the low-stock and payment-failure thresholds under **Profile > Notifications**. Notifications older than 30 days are archived by the backend cleanup job and no longer appear in the bell.

Build command: `npm install`  
Start command: `npm start`

### Frontend on Vercel

Set the project root to `frontend` and add:

```text
REACT_APP_API_URL=https://your-api-host.example/api
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Omit `REACT_APP_GOOGLE_CLIENT_ID` if Google login is disabled. Redeploy after changing any `REACT_APP_*` value because Create React App embeds it during the build. `frontend/vercel.json` keeps BrowserRouter pages working after a direct refresh.

## First administrator

Register a normal account, then promote it directly in MySQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'owner@example.com';
```

Log out and sign in again so the new role is included in the JWT.

## Import products from Excel

Open **Admin > Products**, select **Import Excel**, then download the `.xlsx` template. The required columns are product name, price and stock. Description, category and image URL are optional.

Each file can contain up to 1,000 products and must be no larger than 5 MB. The API validates every row first; if one row is invalid, no products from that file are inserted.

## Product images

Administrators can upload JPEG, PNG or WebP images from the product form. Files are stored under `UPLOAD_DIR/products`; each image is limited to 5 MB. Render and similar hosts use an ephemeral filesystem by default, so attach a persistent disk or replace this storage adapter with an object-storage provider before production use.

## Security notes

- Never commit `.env`; only commit `.env.example`.
- If a real `.env` was pushed previously, removing it from the current commit is not enough. Rotate database, SMTP, VNPay, OAuth and JWT credentials, then update the deployment environment variables.
- Access tokens are short lived. Refresh tokens are random, stored as hashes in MySQL and sent only through an HttpOnly cookie. Production frontend and backend must use HTTPS and the exact frontend origin must be present in `CLIENT_URL`.
- Login, password-reset and API endpoints are rate limited; Helmet supplies baseline browser security headers. Request data is validated, null bytes and prototype-pollution keys are removed, and SQL values use placeholders.
- Product prices and order totals are recalculated by the API. Admin-only product and order routes are protected on the server.
- Password-reset links expire after 30 minutes and become invalid immediately after the password changes. Without SMTP in local development, the forgot-password response includes a test-only reset URL; production never exposes it.
- VNPay callbacks are accepted only after checksum, transaction reference and amount verification. Never expose `VNPAY_SECURE_SECRET` through a frontend environment variable.
