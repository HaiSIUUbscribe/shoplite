# ShopLite

ShopLite is a React, Express and MySQL storefront with product management, inventory-safe checkout, order tracking, customer accounts and an admin dashboard.

## Local setup

1. Create the database with `backend/database/schema.sql`.
2. Copy `backend/.env.example` to `backend/.env` and fill in the database credentials and a strong `JWT_SECRET`.
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

## Upgrade an existing database

Back up the database, then run `backend/database/migration-2026-professional.sql` once before deploying this version. After that, run `backend/database/migration-2026-vnpay.sql` to add VNPay payment state and the `transactions` table, followed by `backend/database/migration-2026-product-variants.sql` for product size and color options. Existing products receive a stock value of `0`, so update their inventory in the admin product page after migration.

If a column or unique email index was already added manually, remove that matching statement from the migration before running it.

## Deployment

### Backend

Configure these environment variables in Render or the backend host:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `DB_SSL=true` for a managed MySQL provider, or `false` for local MySQL
- `JWT_SECRET` with a long random value
- `CLIENT_URL` with comma-separated frontend origins, for example the Vercel production and preview URLs
- `PUBLIC_API_URL` with the public backend origin, used for uploaded image URLs
- `UPLOAD_DIR` pointing to persistent storage in production
- `FRONTEND_URL` and `JWT_RESET_SECRET` for password-reset links
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` and `SUPPORT_EMAIL` for password reset, contact and order-confirmation email
- `VNPAY_TMN_CODE`, `VNPAY_SECURE_SECRET`, `VNPAY_HOST` and `VNPAY_TEST_MODE` for VNPay
- `VNPAY_RETURN_URL` with the public backend URL ending in `/api/payments/vnpay/return`

Register `https://your-api-host.example/api/payments/vnpay/ipn` as the IPN URL in the VNPay merchant portal. Both Return and IPN URLs must use HTTPS in production and point to the backend, not Vercel frontend routes.

Build command: `npm install`  
Start command: `npm start`

### Frontend on Vercel

Set the project root to `frontend` and add:

```text
REACT_APP_API_URL=https://your-api-host.example/api
```

Redeploy after changing any `REACT_APP_*` value because Create React App embeds it during the build. `frontend/vercel.json` keeps BrowserRouter pages working after a direct refresh.

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
- If a real `.env` was pushed previously, rotate the database password and `JWT_SECRET`, then update the deployment environment variables.
- Product prices and order totals are recalculated by the API. Admin-only product and order routes are protected on the server.
- Password-reset links expire after 30 minutes and become invalid immediately after the password changes. Without SMTP in local development, the forgot-password response includes a test-only reset URL; production never exposes it.
- VNPay callbacks are accepted only after checksum, transaction reference and amount verification. Never expose `VNPAY_SECURE_SECRET` through a frontend environment variable.
