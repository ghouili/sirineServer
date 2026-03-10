SlotyCare API - Multi-DB Shared Schema Report
=============================================

What the backend does
- Provides a tenant-aware scheduling and clinic management API.
- Enforces subscription-first access for tenants.
- Supports RBAC for admin, praticien, assistant, and super_admin.
- Manages patients, services, schedules, appointments, waitlist, and documents.

Tenancy model (Multi-DB Shared Schema)
- Global DB holds commercial tables and tenant registry.
- Each tenant has its own database with the same schema.
- All tenant-scoped queries still include tenant_id for defense-in-depth.

Global DB tables
- super_admins
- tenants
- licenses
- promotions
- subscriptions
- tenant_databases (maps tenant_id -> db_url and metadata)

Tenant DB tables
- users
- patients
- services
- service_practitioners
- service_rules
- working_hours
- breaks
- time_off
- holidays
- appointments
- waitlist_entries
- notifications
- documents
- document_access_logs
- audit_logs

Local MySQL setup (any machine)
1) Install MySQL and create databases:
   - slotycare_global
   - slotycare_tenant
   - slotycare (optional legacy shared DB)

2) Configure .env:
   DATABASE_URL=mysql://root:@127.0.0.1:3306/slotycare
   GLOBAL_DATABASE_URL=mysql://root:@127.0.0.1:3306/slotycare_global
   TENANT_DATABASE_URL=mysql://root:@127.0.0.1:3306/slotycare_tenant
   TENANT_DB_ADMIN_URL=mysql://root:@127.0.0.1:3306/mysql
   TENANT_DB_HOST=127.0.0.1
   TENANT_DB_USER=root
   TENANT_DB_PASSWORD=
   JWT_SECRET=secret@123

3) Install dependencies:
   npm install

4) Generate Prisma clients:
   npm run prisma:generate:global
   npm run prisma:generate:tenant

5) Run migrations:
   npm run prisma:migrate:global
   npm run prisma:migrate:tenant

6) Seed global + tenant data:
   npx prisma db seed

Health verification (multi-DB)
- GET /health
- Validates global DB and all tenant DBs listed in tenant_databases.
- Returns 200 when all tenant DBs are reachable, 503 otherwise.

How to test (requests.http)
- Install REST Client extension.
- Open requests.http and run in order:
  1) /health
  2) superadmin login
  3) list licenses
   4) create tenant (auto provisions tenant DB)
  5) create subscription
  6) tenant login
  7) tenant CRUD flows
  8) availability, appointments, waitlist, documents

Endpoints summary
Health
- GET /health

Auth
- POST /auth/superadmin/login
- POST /auth/login

Tenant test
- GET /tenants/me

Superadmin
- GET /licenses
- POST /licenses
- GET /licenses/:id
- PATCH /licenses/:id
- DELETE /licenses/:id
- GET /promotions
- POST /promotions
- GET /promotions/:id
- PATCH /promotions/:id
- DELETE /promotions/:id
- GET /tenants
- POST /tenants
- POST /tenants/:id/provision-db (manual recovery)
- GET /tenants/:id
- PATCH /tenants/:id
- DELETE /tenants/:id
- GET /subscriptions
- POST /subscriptions
- GET /subscriptions/:id
- PATCH /subscriptions/:id
- PATCH /subscriptions/:id/status
- DELETE /subscriptions/:id
- GET /kpi

Tenant admin (role=admin)
- Users: GET /users, POST /users, GET /users/:id, PATCH /users/:id,
  PATCH /users/:id/reset-password, DELETE /users/:id
- Patients: GET /patients, POST /patients, GET /patients/:id,
  PATCH /patients/:id, DELETE /patients/:id
- Services: GET /services, POST /services, GET /services/:id,
  PATCH /services/:id, DELETE /services/:id
- Service practitioners: POST /services/:id/practitioners,
  DELETE /services/:id/practitioners/:userId
- Service rules: GET /service_rules, POST /service_rules, GET /service_rules/:id,
  PATCH /service_rules/:id, DELETE /service_rules/:id
- Scheduling:
  GET/POST/PATCH/DELETE /working_hours
  GET/POST/PATCH/DELETE /breaks
  GET/POST/PATCH/DELETE /time_off
  GET/POST/PATCH/DELETE /holidays

Availability
- GET /availability/slots

Appointments
- GET /appointments
- POST /appointments
- GET /appointments/:id
- PATCH /appointments/:id
- DELETE /appointments/:id

Waitlist
- GET /waitlist
- POST /waitlist
- PATCH /waitlist/:id

Documents
- GET /documents
- POST /documents
- GET /documents/:id
- GET /documents/:id/download

Public
- GET /public/documents/:id?tenant_slug=...&patient_id=...
