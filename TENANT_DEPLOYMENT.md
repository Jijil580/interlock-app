# New Company Setup

Each company gets its own Render backend, Atlas database, and Vercel frontend. The existing PK Interlock production app stays on `main` and keeps its current database.

## PK Interlock 2

1. In MongoDB Atlas, create a database named `pk_interlock2` and a database user with read/write access only to that database. Use the existing Mumbai cluster for a separate logical database, or create a separate cluster for stronger resource isolation. A separate database isolates records but shares the cluster's compute and storage capacity.
2. In Render, create a new Web Service from `Jijil580/interlock-backend`, branch `main`, with build command `npm install` and start command `node server.js`. Name it `pkinterlock2-api`.
3. Set the new Render service environment variables below. Do not modify the existing PK Interlock Render service. The `MONGO_URI` must target `pk_interlock2`, not the current company's database.
4. In Vercel, create a new project from `Jijil580/interlock-app`, choose branch `pkinterlock2`, and use the standard Vite build (`npm run build`, output directory `dist`). Name the project `pkinterlock2`.
5. Set the Vercel variables below for Production, Preview, and Development as needed. `VITE_API_URL` is the new Render service base URL without `/api`.
6. Deploy the Render backend first, then the Vercel frontend. Create/verify the PK Interlock 2 admin login, then test sales, stock, purchases, reports, and quotations. The first start seeds only the configured admin if `INITIAL_ADMIN_USERNAME` and `INITIAL_ADMIN_PASSWORD` are set.

## Render Environment Variables

Required for the new tenant:

| Variable | Example / purpose |
| --- | --- |
| `MONGO_URI` | Atlas connection string whose path database is `/pk_interlock2` |
| `COMPANY_SHORT_NAME` | `PK Interlock 2` |
| `INITIAL_ADMIN_NAME` | PK Interlock 2 admin's display name |
| `INITIAL_ADMIN_USERNAME` | A new, unique admin username |
| `INITIAL_ADMIN_PASSWORD` | A strong, unique password; keep it secret |

Company-specific branding and invoice defaults (set these to the real PK Interlock 2 details):

| Variable | Purpose |
| --- | --- |
| `COMPANY_LEGAL_NAME` | Legal/company name on invoices |
| `COMPANY_ADDRESS` | Business address |
| `COMPANY_STATE`, `COMPANY_STATE_CODE` | State and GST state code |
| `COMPANY_GSTIN` | GSTIN |
| `COMPANY_PHONE1`, `COMPANY_PHONE2` | Contact numbers |
| `COMPANY_INVOICE_TITLE`, `COMPANY_INVOICE_PREFIX` | Invoice title and numbering prefix |
| `COMPANY_SIGNATURE_NAME` | Signatory/business name |
| `COMPANY_BANK_NAME`, `COMPANY_BANK_ACCOUNT`, `COMPANY_BANK_IFSC` | Optional bank details |
| `COMPANY_TERMS` | Invoice terms |

## Vercel Environment Variables

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | New Render URL, for example `https://pkinterlock2-api.onrender.com` (no `/api`) |
| `VITE_COMPANY_SHORT_NAME` | `PK Interlock 2` |
| `VITE_COMPANY_LEGAL_NAME` | Company's legal name |
| `VITE_COMPANY_ADDRESS`, `VITE_COMPANY_STATE`, `VITE_COMPANY_STATE_CODE` | Company's address and GST state details |
| `VITE_COMPANY_GSTIN`, `VITE_COMPANY_PHONE1`, `VITE_COMPANY_PHONE2` | Company's GSTIN and phone numbers |
| `VITE_COMPANY_INVOICE_TITLE`, `VITE_COMPANY_INVOICE_PREFIX`, `VITE_COMPANY_SIGNATURE_NAME` | Invoice and signatory details |
| `VITE_COMPANY_BANK_NAME`, `VITE_COMPANY_BANK_ACCOUNT`, `VITE_COMPANY_BANK_IFSC`, `VITE_COMPANY_TERMS` | Optional invoice bank/terms details |

Vite values are bundled into the browser and are **not secrets**. Never put `MONGO_URI` or an admin password in Vercel. Configure secret values only in Render. If you set a custom domain, assign it to the new Vercel project; do not repoint the existing PK Interlock domain.

## Add Another Company Later

Repeat the same setup with that company's own database name, Atlas database user, Render service, Vercel project, and environment values. Use the `pkinterlock2` frontend branch as the reusable tenant template. Never point two companies' backends at the same database.
