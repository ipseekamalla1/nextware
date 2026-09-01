# Nextware — Development Guide

This document covers running Nextware locally, the development demo data, and
the database backup / restore / reset workflow.

> All demo data is **fictional**. Emails use the reserved `.test` / `.example`
> domains and nothing is ever sent to them. The demo bootstrap only runs under
> the `dev` Spring profile and never bypasses authentication or authorization.

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Docker + Docker Compose | recent |
| Java (JDK) | 26 |
| Node.js | 20+ |

---

## 2. Start PostgreSQL

```bash
docker compose up -d postgres
```

This starts `nextware-postgres` (PostgreSQL 16) on `localhost:5432` with database
`nextware` / user `nextware`. Data persists in the `nextware_postgres_data`
volume.

---

## 3. Configure environment variables

### Backend

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env`:

| Variable | Purpose |
|----------|---------|
| `SPRING_PROFILES_ACTIVE=dev` | enables the development data seeder |
| `NEXTWARE_JWT_SECRET` | long random string — `openssl rand -base64 48` |
| `NEXTWARE_SECURITY_BOOTSTRAP_ENABLED=true` | seed companies, roles, users |
| `NEXTWARE_BOOTSTRAP_PASSWORD` | dev-only password shared by every seeded user |
| `NEXTWARE_DEMO_DATA_ENABLED=true` | seed demo master data |

`backend/.env` is git-ignored. Never commit it and never put a real credential in it.

### Frontend

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | backend URL (default `http://localhost:8080`) |
| `NEXT_PUBLIC_DEFAULT_COMPANY_ID` | optional — pre-fills the company field on the sign-in screen |

For convenience during local development you can set
`NEXT_PUBLIC_DEFAULT_COMPANY_ID=10000000-0000-0000-0000-000000000001`
(the demo company id).

---

## 4. Run the backend

```bash
cd backend
set -a && . ./.env && set +a
./mvnw spring-boot:run
```

On first start with the `dev` profile you will see:

```
Nextware development bootstrap starting...
Permissions: OK
Companies: OK
Roles: OK
Users: OK
Units of Measure: OK (...)
Categories: OK (...)
Products: OK (...)
Customers: OK (...)
Suppliers: OK (...)
Warehouses: OK (...)
Development data ready.
```

The seeder is **idempotent** — running the backend again makes no further changes.

---

## 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>.

---

## 6. Demo companies and accounts

| Company | Id |
|---------|----|
| Nextware Demo Company | `10000000-0000-0000-0000-000000000001` |
| Nextware Test Company | `20000000-0000-0000-0000-000000000002` |

All users share the password from `NEXTWARE_BOOTSTRAP_PASSWORD`.

### Nextware Demo Company

| Username | Role |
|----------|------|
| `admin` | SYSTEM_ADMIN |
| `warehouse.manager` | WAREHOUSE_MANAGER |
| `inventory.clerk` | INVENTORY_CLERK |
| `purchasing` | PURCHASING_USER |
| `sales` | SALES_USER |
| `readonly` | READ_ONLY_USER |

### Nextware Test Company (for isolation testing)

| Username | Role |
|----------|------|
| `admin` | SYSTEM_ADMIN |
| `companyb.admin` | SYSTEM_ADMIN |
| `sales` | SALES_USER |

### Role → access summary

| Role | Access |
|------|--------|
| SYSTEM_ADMIN | All permissions |
| WAREHOUSE_MANAGER | Warehouses, locations, inventory + master-data read |
| INVENTORY_CLERK | Inventory operations + warehouse/product read |
| PURCHASING_USER | Suppliers, purchase orders/receipts + product read |
| SALES_USER | Customers, sales orders, reservations + product read |
| READ_ONLY_USER | `*_VIEW` permissions only |

---

## 7. Seeded demo master data (Demo Company)

- 8 units of measure, 8 categories
- 40 products (2 intentionally inactive; one deliberately long name)
- 20 customers (2 inactive), 12 suppliers (1 inactive)
- 4 warehouses (`WH-RETURNS` intentionally has **no** locations)
- 14 locations each in the 3 stocked warehouses

The Test Company gets a small parallel slice (3 products, 2 customers, 2
suppliers, 1 warehouse).

---

## 8. Testing company isolation

1. Sign in as `admin` / **Nextware Demo Company**.
2. Note a product / warehouse / customer id from the Demo Company.
3. Sign in as `admin` / **Nextware Test Company** in another browser profile.
4. Attempt to `GET`/`PUT`/`DELETE` the Demo Company id via the API — every
   master-data endpoint must return `403` (company mismatch) or `404`.

The backend enforces this in `CompanySecurityService.requireCompany(...)` and,
for warehouse locations, in `WarehouseLocationService.requireAuthenticatedWarehouse(...)`.

---

## 9. Database backup / restore / reset

Backups are written to `./backups/` (git-ignored).

| Script | What it does |
|--------|--------------|
| `scripts/db-backup.sh` | timestamped `pg_dump -Fc` into `./backups/` |
| `scripts/db-restore.sh <file> [--yes]` | restore a dump (replaces dev data) |
| `scripts/db-reset.sh [--yes]` | drop + recreate an empty `nextware` DB |
| `scripts/db-shell.sh` | open `psql` against the dev DB |

Typical reset cycle:

```bash
scripts/db-backup.sh          # optional safety copy
# stop the backend
scripts/db-reset.sh --yes
# start the backend (dev profile) -> Flyway + reseed run automatically
```

All four scripts operate **only** on the local `nextware-postgres` container and
refuse to run if it is not present.

---

## 10. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `NEXTWARE_BOOTSTRAP_PASSWORD is not configured` | set it in `backend/.env` and re-source the file |
| `Port 8080 was already in use` | another backend is running; stop it or set `--server.port` |
| Flyway `validate` failure | schema drift — `scripts/db-reset.sh` then restart |
| Frontend calls fail with CORS | backend `SecurityConfig` allows `http://localhost:3000` only |
