SlotyCare API (Multi-DB Shared Schema)
=====================================

Overview
- Global DB: tenants, licenses, promotions, subscriptions, tenant_databases, super_admins
- Tenant DBs: users, patients, scheduling, appointments, waitlist, notifications, documents, logs

Required env vars (dev)
- DATABASE_URL
- GLOBAL_DATABASE_URL
- TENANT_DATABASE_URL (used for seed + health check)
- TENANT_DB_ADMIN_URL, TENANT_DB_HOST, TENANT_DB_USER, TENANT_DB_PASSWORD (for provisioning)
- JWT_SECRET

Setup (local)
1) Install dependencies
	- npm install

2) Run migrations
	- npm run prisma:generate:global
	- npm run prisma:generate:tenant
	- npm run prisma:migrate:global
	- npm run prisma:migrate:tenant

3) Seed global + tenant data
	- npx prisma db seed

Health check
- GET /health
- This verifies the global DB and all tenant DBs from tenant_databases.

Requests testing
- Use requests.http with the REST Client extension.
- It includes auth, tenant admin CRUD, availability, appointments, waitlist, and documents.

Provision a tenant DB (Step 13B)
- Create tenant in global DB via API
- npm run tenant:provision -- --tenantId=<TENANT_ID> --slug=<TENANT_SLUG>

Notes
- tenant_databases registry is filled during provisioning or seed (if TENANT_DATABASE_URL is set).
- Keep tenant_id filters even with per-tenant DBs.
