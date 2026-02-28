# Copilot Instructions — SlotyCare API (Prisma+MySQL, Multi-DB Shared Schema)

## Architecture rules (non-negotiable)
- Multi-DB + Shared Schema multi-tenancy: tenant-scoped data lives in a per-tenant database.
- Keep `tenant_id` filters for defense-in-depth on all tenant-scoped tables.
- Every by-id read/update/delete must verify `(id AND tenant_id)` (never `id` alone).
- Add `tenant_id` to all created tenant records from `req.tenant.id` (never accept tenant_id from body).
- Global tables (tenants, licenses, promotions, subscriptions, tenant_databases, super_admins) use the global DB client.
- Tenant tables (users, patients, services, scheduling, appointments, waitlist, notifications, documents, logs) use `req.tenantDb`.

## Tenant resolution
- Tenant is resolved from `X-Tenant-Slug` header (primary).
- Attach `req.tenant = { id, slug }` and `req.tenantDb` (tenant-specific Prisma client).
- If tenant-required route without slug => 400; unknown slug => 404.

## Tenant registry (tenant_databases)
- `tenant_databases` lives in the global DB and maps `tenant_id` -> `db_url` and metadata.
- Tenant DB URL must be resolved from the registry before any tenant-scoped query.
- Registry writes happen only in provisioning flows (never from tenant API input).

## Health verification policy
- `/health` checks global DB connectivity and verifies all tenant DBs from the registry.
- Any tenant DB failure should mark health as degraded (non-200).

## Subscription gating (critical business rule)
- Block login and tenant API access if there is no active subscription:
  - subscription.status == "active"
  - subscription.start_date <= now <= subscription.end_date
- Enforce via `requireActiveSubscription` middleware on all tenant routes.

## Auth/RBAC
- JWT with claims: sub, role, tenant_id (except super_admin).
- Roles: super_admin, admin, praticien, assistant.
- Use `requireRole()` per route group.

## Scheduling & anti double-booking
- Appointment creation must be transactional.
- Overlap check must use: `(newStart < existingEnd AND newEnd > existingStart)` and exclude canceled.

## Email notifications (Gmail only)
- Use Gmail API OAuth2 (no SMTP password auth).
- Notifications are queued and sent by a worker.
- Table-driven: notifications.status, schedule_at, tries.

## Logging
- POST/PATCH/DELETE must create an `audit_logs` row.
- Document view/download must create a `document_access_logs` row.

## API conventions
- Always validate inputs with zod.
- Standard response: { success, data, error, meta }.
- Pagination on list endpoints (limit/offset).