# Architecture & Coding Rules
## Multi-Category Lead & Quotation CRM — Engineering Standards

**Version:** 1.0
**Status:** Mandatory for all contributors and AI coding agents
**Companion docs:** `01_BRD.md`, `02_PRD.md`, `03_DATA_MODEL_AND_API_SPEC.md`

---

## 0. How To Use This Document

This file is the **constitution** of the codebase. Every commit, PR, and AI-generated code block must comply. If a rule here conflicts with a spec doc, this file wins — open a discussion to update it rather than silently breaking the rule.

**For AI coding agents:** Treat every `MUST`, `NEVER`, and `ALWAYS` as a hard constraint. When uncertain, prefer the boring, explicit, well-tested path over the clever one.

---

## 1. Architecture Overview

### 1.1 System Shape

A classic **modular monolith** with a clean front-end / API split. No microservices in MVP. The goal is a codebase one mid-level engineer can hold in their head.
┌────────────────────────────────────────────────────────────────┐
│ CLIENT (Browser) │
│ │
│ React SPA (TypeScript) │
│ ├── Routing (React Router) │
│ ├── Global Category Scope Context │
│ ├── Auth Context │
│ ├── Data layer (TanStack Query + typed API client) │
│ └── Feature modules (dashboard, leads, quotations, staff) │
└───────────────────────────┬────────────────────────────────────┘
│ HTTPS / JSON
│ Bearer JWT
│ X-Category-Scope: <uuid|ALL>
▼
┌────────────────────────────────────────────────────────────────┐
│ API SERVER (Node + TypeScript) │
│ │
│ Express (or Fastify) — thin HTTP layer │
│ ├── Routes → Controllers (request parsing, response shape) │
│ ├── Services (business logic, RBAC scope resolution) │
│ ├── Repositories (DB access, all queries live here) │
│ ├── Middleware (auth, scope, validation, error handling) │
│ └── Jobs (later phase: reminders, exports) │
└───────────────────────────┬────────────────────────────────────┘
│ Prisma (typed SQL)
▼
┌────────────────────────────────────────────────────────────────┐
│ PostgreSQL (single instance) │
│ ─ UUID PKs, enums for status, proper indexes │
│ ─ No business logic in DB (no triggers for logic) │
└────────────────────────────────────────────────────────────────┘

text

### 1.2 Non-Negotiable Architectural Decisions

| Decision | Choice | Why |
|---|---|---|
| Language | **TypeScript** everywhere (front + back) | Catches the exact class of bug this project exists to fix (data integrity) |
| Backend framework | **Express** (or Fastify) — plain, boring | Small surface, huge ecosystem, easy for agents to reason about |
| ORM | **Prisma** | Typed queries, migration safety, no raw SQL soup |
| Database | **PostgreSQL** | Relational data, enums, UUID, JSONB if needed |
| Frontend | **React + Vite + TypeScript** | Fast dev, standard, no framework churn |
| Data fetching | **TanStack Query** | Cache, retries, scoped invalidation built in |
| Styling | **Tailwind CSS** + a small set of shared components | Enforces a design system instead of ad-hoc CSS |
| Auth | **JWT (short-lived) + refresh token (httpOnly cookie)** | Stateless API, standard, works with future mobile |
| Validation | **Zod** on every boundary (request body, query, response) | One schema, one source of truth, shared with frontend |
| Testing | **Vitest** + **Supertest** (API) + **React Testing Library** (UI) | Fast, modern, well-supported |
| Package manager | **pnpm** with workspaces | Monorepo, deterministic installs |
| Monorepo tooling | **Turborepo** (or plain pnpm workspaces) | Simple task graph, caching |

### 1.3 Monorepo Layout
/
├── apps/
│ ├── api/ # Express + Prisma backend
│ │ ├── src/
│ │ │ ├── modules/ # feature-first: leads, quotations, staff, ...
│ │ │ ├── middleware/
│ │ │ ├── lib/ # auth, logger, errors, config
│ │ │ ├── db/ # prisma client, seeders
│ │ │ └── server.ts
│ │ ├── prisma/
│ │ │ ├── schema.prisma
│ │ │ └── migrations/
│ │ └── tests/
│ └── web/ # React + Vite frontend
│ ├── src/
│ │ ├── app/ # routing, providers, layout
│ │ ├── features/ # feature-first: leads, quotations, ...
│ │ ├── components/ # shared UI primitives
│ │ ├── lib/ # api client, hooks, utils
│ │ └── main.tsx
│ └── tests/
├── packages/
│ ├── shared/ # shared TS types, Zod schemas, enums
│ │ └── src/
│ │ ├── types/ # entity types (Lead, Quotation, …)
│ │ ├── schemas/ # Zod schemas used by both apps
│ │ └── constants/ # enums, status lists, probabilities
│ └── config/ # eslint, tsconfig, prettier presets
├── docs/ # 01_BRD.md, 02_PRD.md, 03_DATA_MODEL..., this file
├── package.json
├── pnpm-workspace.yaml
└── turbo.json

text

---

## 2. Backend Architecture

### 2.1 Layered Design (strict)

Every backend feature lives in `apps/api/src/modules/<feature>/` and MUST follow this layering:
modules/leads/
├── leads.routes.ts # HTTP paths → controller fns (no logic)
├── leads.controller.ts # parse req, call service, shape res
├── leads.service.ts # business logic, RBAC, transactions
├── leads.repository.ts # Prisma queries ONLY (no logic)
├── leads.schemas.ts # Zod schemas for request/response
├── leads.types.ts # module-local types (re-exported from shared)
└── leads.test.ts # unit + integration tests

text

**Hard rules:**

1. **Routes** contain zero business logic. They wire paths to controllers and attach middleware.
2. **Controllers** only:
   - Read from `req` (params, query, body, `req.user`, `req.scope`)
   - Call one service method
   - Return via a shared `ok()` / `fail()` response helper
   - NEVER touch Prisma directly.
3. **Services** contain all business logic and RBAC checks. They:
   - Receive plain typed inputs (not `Request`)
   - Call repositories for data
   - Throw typed domain errors (`NotFoundError`, `ForbiddenError`, `ValidationError`)
   - Never import Express types.
4. **Repositories** contain all Prisma calls. They:
   - Accept typed filters and return typed entities
   - NEVER do RBAC, validation, or business rules
   - Are the ONLY place `.prisma` is imported.
5. Cross-module calls go **service → service**, never repository → repository.

### 2.2 RBAC & Scope — Mandatory Enforcement

RBAC is a **security boundary**, not a UI concern. The implementation MUST follow `03_DATA_MODEL_AND_API_SPEC.md §4` exactly. Rules:

- **Every** scoped endpoint MUST read `X-Category-Scope` header.
- The **scope middleware** resolves `req.scope = { categoryIds: string[], isAll: boolean }` based on the authenticated staff member.
- **Every repository query for scoped entities** MUST receive `req.scope` and apply it. There is no "forgot to filter" path.
- The service layer NEVER trusts a `category_id` from the request body unless it is inside the caller's scope.
- Row-level rules (Sales Staff sees only own leads) are enforced **in the repository's `where` clause**, not in JS `filter()` after fetching.
- **Writes** re-verify scope on the target row before mutating. Never rely on the client having fetched it.

**Anti-pattern to forbid:**

```ts
// ❌ NEVER
const lead = await prisma.lead.findUnique({ where: { id } });
if (lead.assigned_staff_id !== req.user.id) throw new ForbiddenError();
Correct pattern:

ts
// ✅ ALWAYS
const lead = await leadRepo.findByIdForScope(id, req.scope);
// findByIdForScope applies assigned_staff_id AND category_id in the WHERE clause
if (!lead) throw new NotFoundError('Lead');
Rationale: returning 404 (not 403) for out-of-scope rows prevents enumeration attacks and keeps logic in one place.

2.3 Error Handling
One error class hierarchy in lib/errors.ts:
AppError → ValidationError(400), UnauthorizedError(401), ForbiddenError(403), NotFoundError(404), ConflictError(409), InternalError(500).

A single error middleware at the bottom of the chain converts AppError to a JSON envelope:

json
{ "error": { "code": "LEAD_NOT_FOUND", "message": "…", "details": null } }
Unknown errors are logged with full context and returned as generic 500 — never leak stack traces or SQL in production.

Controllers NEVER try/catch to shape errors; they let the middleware handle it. Only the middleware catches.

Async route handlers are wrapped by an asyncHandler() helper so unhandled rejections always reach the error middleware.

2.4 Validation
All request input (body, query, params) is parsed with Zod at the controller boundary.

Schemas live in packages/shared/src/schemas/ so the frontend reuses the exact same shape.

On parse failure → throw ValidationError with field-level details.

The service layer receives already-validated, typed inputs. It MUST NOT re-validate types — only business rules (e.g. lost_reason required when status = LOST).

Never trust enums from the client — always validate against the shared enum constant.

2.5 Database Rules
UUID v4 for all primary keys. Never auto-increment integers exposed to clients.

Enums in Postgres for anything in 03_DATA_MODEL_AND_API_SPEC.md §3. If you need to add a value, add a migration — do NOT use free-text fallback.

All timestamps are timestamptz, stored in UTC. Never timestamp (no tz).

Phone numbers are String in the schema, always. Never Int or BigInt. This is the exact bug the project exists to fix.

Money is stored as Decimal(12,2). Never Float. All money math in JS uses a decimal library (decimal.js), never Number.

Every table has created_at and updated_at with defaults managed by the DB.

Soft delete on Lead, Staff, Category via deleted_at TIMESTAMPTZ NULL. Hard delete is forbidden except in a documented cleanup job.

Every foreign key has an index. Every column used in a WHERE in the spec has an index. Composite indexes for the top 3 query patterns per module.

Migrations are forward-only and committed. Never edit a migration that has been applied. Never use db push in production.

2.6 Transactions
Multi-write operations MUST use a Prisma transaction. Examples:

Creating a Lead + its first LeadActivity (status set to NEW).

Changing Lead status → appending a STATUS_CHANGE activity.

Creating a Quotation with line items.

Reassigning a Lead (update + activity log).

Use prisma.$transaction(async (tx) => { … }) and pass tx down through service/repo calls. Repositories accept an optional client param defaulting to prisma.

Never start a transaction inside a repository. Transactions are a service-layer concern.

2.7 Logging & Observability
Structured JSON logs via Pino. Every log includes:
request_id, user_id, staff_id, route, latency_ms, status.

request_id is generated in middleware and returned in the X-Request-Id response header.

Log levels: debug (dev only), info (default), warn, error.

NEVER log: passwords, JWTs, full phone numbers, or PII beyond the minimum needed.

Every 5xx triggers an error log with stack. Every 4xx triggers warn.

2.8 Config & Secrets
All config via environment variables, validated at boot with Zod in lib/config.ts. If a var is missing, the process crashes on start — not on first request.

.env is gitignored. .env.example is committed and lists every required var.

No secret ever in code, tests, or migrations.

Environments: development, test, production. Behavior differences live in config, never in if (process.env.NODE_ENV === 'production') scattered around business logic.

3. Frontend Architecture
3.1 Structure (feature-first)
text
apps/web/src/
├── app/
│   ├── App.tsx               # providers + router
│   ├── router.tsx            # route table
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ScopeProvider.tsx     # global category scope
│   │   └── QueryProvider.tsx
│   └── layout/
│       ├── AppShell.tsx
│       ├── Sidebar.tsx
│       └── Topbar.tsx        # includes global scope selector
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── reports/
│   ├── leads/
│   ├── quotations/
│   ├── staff/
│   └── settings/
├── components/               # shared, dumb UI primitives
│   ├── Button.tsx
│   ├── Table.tsx
│   ├── Modal.tsx
│   ├── FilterPanel.tsx
│   ├── StatusPill.tsx
│   └── ...
├── lib/
│   ├── api/
│   │   ├── client.ts         # axios/fetch wrapper, injects scope header
│   │   ├── queryKeys.ts      # centralized query key factory
│   │   └── hooks/            # per-feature query hooks
│   ├── auth/
│   ├── format/               # currency, dates, phone display
│   └── utils/
└── main.tsx
3.2 Rules
Feature-first, not type-first. All code for "leads" lives under features/leads/. Never a top-level services/ or hooks/ folder that mixes features.

Server state ≠ client state.

Server state → TanStack Query. Never mirror it into useState.

Client-only state (modal open, filter drafts) → useState / useReducer.

Cross-cutting client state (auth, scope) → React Context.

Global scope is sacred. The ScopeProvider holds the currently selected category. The API client automatically injects X-Category-Scope on every request. Every query key includes the scope so switching scope refetches correctly. No feature reads the scope directly from localStorage.

Typed API client. Every endpoint has a typed function in lib/api/. Response types come from packages/shared. No any.

No business logic in components. Components render and dispatch. Filtering, sorting, and derived metrics live in hooks or utility functions that are unit-tested.

One component per file. File name matches the default export.

Props are typed and narrow. No props: any. Prefer small, purpose-built components over god-components with 20 props.

Accessibility is not optional. Every interactive element is a <button> or has role + keyboard handler. Every input has a <label>. Color is never the only signal (status pills have text + dot).

Loading & error states are mandatory. Every query has an explicit loading skeleton and an error state. Never render data! without a check.

No prop drilling past 2 levels. Use Context or compose.

Forms use controlled inputs with Zod validation on submit. Show field-level errors returned by the API.

3.3 Routing & Access
Routes are declared centrally in router.tsx with a meta: { roles: [...] } field.

A <RequireRole roles={[…]}> wrapper renders the route or redirects.

The UI hiding a route is not security — the API enforces the same rule. This is defense in depth, not the defense.

4. Shared Package Rules
packages/shared is the single source of truth for:

Entity types (Lead, Quotation, Staff, Category, …)

Enums (LeadStatus, LeadSource, QuotationStatus, StaffRole)

Zod schemas for request/response payloads

Constants (win-probability table, page sizes, ID prefixes)

Both api and web import from @crm/shared. Never duplicate a type or enum.

When the DB schema changes, update schema.prisma and the shared type and the Zod schema in the same PR. Add a checklist item to the PR template.

Shared code MUST be framework-agnostic. No Express, no React, no Prisma imports.

5. Coding Standards (Both Apps)
5.1 Naming
Kind	Convention	Example
Files (components)	PascalCase.tsx	LeadDetail.tsx
Files (others)	kebab-case.ts	lead-service.ts
Folders	kebab-case	features/quotations/
Variables, functions	camelCase	assignedStaffId
Types, interfaces, enums	PascalCase	LeadStatus
Constants	SCREAMING_SNAKE_CASE	DEFAULT_PAGE_SIZE
DB tables / columns	snake_case (Prisma maps to camelCase)	assigned_staff_id
Booleans	prefix with is / has / can	isHotLead, hasQuote
Event handlers	handleX prop, onX for callbacks	handleSubmit / onSubmit
No abbreviations except universal ones (id, url, api, db).

No Hungarian notation. No I prefix on interfaces. No Enum suffix on enums.

5.2 Functions
Max ~40 lines per function. If longer, extract.

Max 3 parameters. Beyond that, take an options object.

One job per function. If the name has "and" in it, split it.

Early returns over nested if. Guard clauses at the top.

Pure functions where possible. Side effects isolated and named clearly (saveLead, sendEmail).

5.3 Types
strict: true in every tsconfig.json. noUncheckedIndexedAccess: true. noImplicitOverride: true.

No any. Use unknown and narrow. ESLint rule @typescript-eslint/no-explicit-any is an error.

No non-null assertion ! unless accompanied by a comment explaining why it's safe.

Prefer type for unions and simple shapes, interface for extendable object contracts.

Every public function has explicit return types.

Nullable columns are string | null, never string | undefined in DB-facing types. Undefined is for optional inputs only.

5.4 Comments
Comment why, not what. Code says what.

Every public function in services and repositories has a one-line JSDoc: purpose + thrown errors.

TODO comments MUST include an owner and a ticket: // TODO(@anmol, CRM-142): migrate to bulk endpoint.

No commented-out code in commits. Delete it; git remembers.

5.5 Imports
Absolute imports via path aliases: @/features/leads, @crm/shared.

Import order enforced by ESLint: node builtins → external → @crm/* → @/* → relative.

No barrel files (index.ts that re-exports everything) inside features — they cause circular imports and slow builds. Barrels are allowed only at packages/shared top level.

5.6 Async
Always async/await. Never .then() chains for multi-step logic.

Always handle rejection. No floating promises — ESLint no-floating-promises is an error.

Parallel independent awaits with Promise.all. Sequential only when there's a real dependency.

Cancellation: TanStack Query handles it on the client; on the server, no long-running requests in MVP.

6. Testing Standards
6.1 What Must Be Tested
Layer	Test Type	Coverage Target
Repositories	Integration test against real Postgres (test DB)	Every query that involves scope/RBAC
Services	Unit test with mocked repos	Every business rule + every branch
Controllers/Routes	Supertest integration	Happy path + auth + scope + validation failure per endpoint
RBAC	Dedicated test suite	Every role × every scoped endpoint — see §6.3
Frontend hooks	Vitest + Testing Library	Every hook that derives data or handles scope
Frontend components	Testing Library	Anything with conditional rendering or user input
6.2 Rules
Every bug fix ships with a regression test that fails before the fix and passes after.

Tests use factories (makeLead(), makeStaff()) not raw fixtures — keeps them resilient to schema additions.

No test hits the network or a real external service. Third parties are mocked at the module boundary.

Test DB is reset between suites. Use transactions + rollback where possible.

Test names describe behavior: it('returns 404 when sales staff requests a lead outside their category').

No console.log in tests. Use assertions.

6.3 RBAC Test Matrix — Mandatory
Every scoped endpoint MUST have a test that covers all of:

Case	Expected
Super Admin, any scope	200
Super Admin, ALL scope	200
Category Manager, own category	200
Category Manager, other category	403 (or 404)
Sales Staff, own lead	200
Sales Staff, teammate's lead in same category	404
Sales Staff, lead in other category	404
No auth header	401
Invalid/missing X-Category-Scope	400
Malformed scope value	400
This matrix is non-negotiable. A PR that adds a new scoped endpoint without it is blocked.

7. API Contract Rules
All responses use a consistent envelope:

Success: the resource or a paginated shape { data: T[], meta: { page, pageSize, total } }

Error: { error: { code, message, details } }

All list endpoints support page and pageSize (default 25, max 100). Enforced in schema.

All list endpoints return meta.total so the UI can show counts without a second call.

Status codes:

200 read/update success

201 create success (with Location header)

400 validation

401 unauthenticated

403 authenticated but not permitted (only when the resource exists and the caller cannot see it — otherwise 404)

404 not found or out of scope

409 conflict (e.g. duplicate category code)

422 business rule violation (e.g. Won without accepted quote)

500 unexpected

Never return 403 for a resource the caller shouldn't know exists. Return 404. This is critical for the multi-tenant-style isolation the PRD requires.

Idempotency: POST endpoints that create resources should accept an optional Idempotency-Key header. On repeat, return the original response. (Post-MVP, but leave the middleware hook in place.)

Pagination is cursor-friendly by design even if MVP uses offset — the shape is { page, pageSize } now, { cursor } can be added without breaking clients.

Never expose internal IDs that aren't UUIDs (e.g. no auto-increment leaking).

Dates are ISO 8601 strings in JSON, always with timezone (2026-09-16T10:30:00.000Z).

8. Git, PR, and Review Rules
8.1 Branching
Trunk-based: main is always deployable.

Feature branches: feat/leads-filter-panel, fix/rbac-sales-staff-scope, chore/upgrade-prisma.

No long-lived branches. Merge within 2 days or break the work down.

8.2 Commits
Conventional Commits: feat(leads): add multi-select status filter.

One logical change per commit. No "fix stuff" or "wip".

Every commit passes lint, typecheck, and tests locally.

8.3 Pull Requests
Every PR MUST include:

□ A short description of what and why
□ Screenshots for UI changes
□ A test plan (what was tested manually + what tests were added)
□ Confirmation that no any, no non-null assertions without comments, and no floating promises were introduced
□ If DB schema changed: migration included and shared types updated and Zod schemas updated
□ If a scoped endpoint was added: the RBAC matrix from §6.3 is filled in
A PR is not mergeable until:

CI is green (lint, typecheck, tests, build)

At least one human review

No unresolved comments

Branch is up to date with main

8.4 Definition of Done
A feature is Done only when:

It matches the spec in 02_PRD.md / 03_DATA_MODEL_AND_API_SPEC.md.

It has unit + integration tests per §6.

It has RBAC coverage per §6.3.

It has loading, empty, and error states in the UI.

It is instrumented with logs per §2.7.

It is documented in the PR and, if user-facing, in the release notes.

It does not introduce any, @ts-ignore, or eslint-disable without a comment and a linked ticket.

9. Anti-Patterns — Explicitly Forbidden
The following will be rejected in review. AI agents MUST NOT generate these.

Anti-pattern	Why it's banned
any in TypeScript	Defeats the type system, hides the exact class of bug this project fixes
@ts-ignore / @ts-expect-error without a ticket	Silent breakage
Storing phone numbers, money, or IDs as number/float	The original bug from the Excel files
RBAC checks in controllers or UI only	Must be in service + repository
Fetching a row then filtering by scope in JS	Slow, leaks via timing, easy to forget
prisma import outside repositories	Coupling, hard to test
Business logic in React components	Untestable, duplicated, drifts
Server state duplicated into useState	Stale data, double source of truth
Global scope read from anywhere except ScopeProvider	Inconsistent scope = data leak
Free-text where the spec says enum	The original "APPLIANCES/APLLIANCES" problem
try/catch in every controller	Hides errors, duplicates handling
console.log in committed code	Use the logger
Raw SQL string concatenation	Injection risk
Editing an applied migration	Breaks every other environment
db push in staging/production	No audit trail
Returning 403 where 404 is correct	Enumeration attack
Silent .catch(() => {})	Swallowed errors
Commented-out code	Noise; git has history
Barrel files inside features	Circular deps
Long functions (>40 lines)	Hard to test, hard to review
Long parameter lists (>3)	Unreadable call sites
Direct fetch in components	Bypasses scope injection + auth
Hardcoded category IDs or names	Categories are admin-configurable
Hardcoded win probabilities	Configurable per §5 of spec
Skipping loading/error states	Broken UX in production
Skipping the RBAC test matrix	Security incident waiting to happen
10. Performance & Scalability Guardrails
The MVP handles tens of thousands of leads. These rules keep it that way without premature optimization.

Index the filters. Every column used in a scoped WHERE or ORDER BY on a list endpoint has an index. Add composite indexes for (category_id, assigned_staff_id, status) and (category_id, won_at).

No N+1. Prisma include or a single findMany with relations. If a list endpoint touches more than 3 tables, review the query plan.

Paginate everything. No endpoint returns unbounded rows. Default 25, max 100.

Dashboard aggregates are computed with SQL GROUP BY, not by loading all leads into Node and reducing. If a specific aggregate becomes slow, add a materialized view — do NOT cache in Redis until the DB is genuinely the bottleneck.

Response size. List endpoints return only the fields the list view needs. Detail endpoints return the full entity. Never return the kitchen sink "just in case".

Frontend:

Route-level code splitting (React.lazy).

Table rows virtualized only if a page exceeds ~200 rows — paginate instead.

Debounce search inputs by 300ms.

No chart library heavier than Recharts (or CSS-only charts like the prototype) for MVP.

Timeouts. API requests have a 10s timeout. DB queries have a 5s statement timeout. Long-running work (exports, imports) belongs in a job queue (post-MVP) — never in a request.

11. Security Checklist (Every PR)
□ Input validated by Zod at the controller boundary
□ RBAC scope applied in the repository where clause
□ No PII in logs
□ No secrets in code or tests
□ SQL is parameterized (Prisma handles this, but no raw string SQL)
□ Response does not leak fields the caller shouldn't see (e.g. other staff's phone numbers on a leaderboard)
□ Error messages don't leak internal structure (no table names, no stack traces in prod)
□ Auth token is short-lived; refresh is httpOnly + SameSite=Lax
□ CORS is restricted to the known web origin(s)
□ Rate limiting on /auth/login (10/min per IP)
□ No eval, no Function(), no dynamic code execution
□ Dependencies scanned (pnpm audit) — no high/critical unpatched
12. Documentation Requirements
This file is updated whenever an architectural decision changes. ADRs (Architecture Decision Records) go in docs/adr/NNN-title.md.

Each module has a README.md in its folder describing:

Its responsibility

Its public service methods

Its scoped queries and their RBAC rules

Known limitations

The API has an OpenAPI spec generated from the Zod schemas (via zod-to-openapi) served at /api/docs in non-production environments.

Every non-obvious business rule (e.g. "WON requires an ACCEPTED quotation") is documented in the service method's JSDoc AND referenced in the PRD.

13. Change Management — What To Do When You Need To Break A Rule
Sometimes a rule here is wrong for a real reason. That's fine, but the process is:

Open a short ADR in docs/adr/ describing:

The rule you want to break

Why the rule exists

What the new approach is

What could go wrong and how you'll mitigate it

Get sign-off from the tech lead.

Update this file in the same PR that introduces the exception.

Never silently break a rule. Silent exceptions are how codebases rot.

14. Quick Reference — The 10 Commandments
TypeScript strict, no any, no non-null ! without a comment.

Validate every boundary with Zod.

RBAC lives in the repository, not the UI.

All DB access goes through repositories.

All business logic goes through services.

All money, phone numbers, and IDs are stored and handled as strings/decimals — never floats.

Every scoped endpoint has the full RBAC test matrix.

Server state belongs in TanStack Query, not useState.

No secrets, no PII in logs, no stack traces to clients.

When in doubt, choose the boring, explicit, tested path.

15. Appendix — Reference Snippets
15.1 Repository Example (Leads)
ts
// apps/api/src/modules/leads/leads.repository.ts
import { prisma } from '@/db/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { Scope } from '@/lib/scope';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Returns a lead only if it is inside the caller's scope.
 * Applies category_id AND assigned_staff_id filters in the WHERE clause.
 * Throws nothing — callers decide between 404 and 403.
 */
export async function findByIdForScope(
  id: string,
  scope: Scope,
  db: Db = prisma,
) {
  return db.lead.findFirst({
    where: {
      id,
      deletedAt: null,
      categoryId: scope.isAll ? { in: scope.categoryIds } : scope.categoryIds[0],
      ...(scope.isSalesStaff ? { assignedStaffId: scope.staffId } : {}),
    },
    include: {
      activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      quotations: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function listForScope(
  filters: LeadListFilters,
  scope: Scope,
  pagination: { page: number; pageSize: number },
  db: Db = prisma,
) {
  const where: Prisma.LeadWhereInput = {
    deletedAt: null,
    categoryId: scope.isAll ? { in: scope.categoryIds } : scope.categoryIds[0],
    ...(scope.isSalesStaff ? { assignedStaffId: scope.staffId } : {}),
    ...(filters.status?.length ? { status: { in: filters.status } } : {}),
    ...(filters.assignedStaffIds?.length ? { assignedStaffId: { in: filters.assignedStaffIds } } : {}),
    ...(filters.sources?.length ? { source: { in: filters.sources } } : {}),
    ...(filters.hotLead ? { hotLead: true } : {}),
    ...(filters.dateFrom || filters.dateTo
      ? { createdAt: { gte: filters.dateFrom, lte: filters.dateTo } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    }),
    db.lead.count({ where }),
  ]);

  return { rows, total };
}
15.2 Service Example (Lead Status Change with Timeline)
ts
// apps/api/src/modules/leads/leads.service.ts
import { prisma } from '@/db/prisma';
import * as leadRepo from './leads.repository';
import { NotFoundError, ValidationError } from '@/lib/errors';
import type { Scope } from '@/lib/scope';
import type { ChangeStatusInput } from '@crm/shared/schemas/leads';

/**
 * Changes a lead's status and appends a STATUS_CHANGE activity atomically.
 * @throws NotFoundError if the lead is outside the caller's scope
 * @throws ValidationError if the status transition violates a business rule
 */
export async function changeStatus(
  leadId: string,
  input: ChangeStatusInput,
  scope: Scope,
) {
  return prisma.$transaction(async (tx) => {
    const lead = await leadRepo.findByIdForScope(leadId, scope, tx);
    if (!lead) throw new NotFoundError('Lead');

    // Business rules
    if (input.status === 'LOST' && !input.lostReason) {
      throw new ValidationError('lost_reason is required when status is LOST');
    }
    if (input.status === 'WON' && !input.wonValue) {
      throw new ValidationError('won_value is required when status is WON');
    }

    const updated = await tx.lead.update({
      where: { id: leadId },
      data: {
        status: input.status,
        lostReason: input.status === 'LOST' ? input.lostReason : lead.lostReason,
        wonValue: input.status === 'WON' ? input.wonValue : lead.wonValue,
        wonAt: input.status === 'WON' ? new Date() : lead.wonAt,
      },
    });

    await tx.leadActivity.create({
      data: {
        leadId,
        type: 'STATUS_CHANGE',
        note: input.note ?? `Status changed to ${input.status}`,
        oldStatus: lead.status,
        newStatus: input.status,
        createdByStaffId: scope.staffId,
      },
    });

    return updated;
  });
}
15.3 Scope Middleware
ts
// apps/api/src/middleware/scope.ts
import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { staffCategoryRepo } from '@/modules/staff/staff.repository';
import type { Scope } from '@/lib/scope';

export async function resolveScope(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.header('X-Category-Scope');
  if (!header) throw new ValidationError('X-Category-Scope header is required');

  const staff = req.user!; // set by auth middleware

  if (staff.role === 'SUPER_ADMIN') {
    req.scope = header === 'ALL'
      ? { isAll: true, categoryIds: [], staffId: staff.id, isSalesStaff: false }
      : { isAll: false, categoryIds: [header], staffId: staff.id, isSalesStaff: false };
    return next();
  }

  const allowed = await staffCategoryRepo.listCategoryIdsForStaff(staff.id);

  if (header === 'ALL') {
    if (allowed.length === 0) throw new ForbiddenError('No category access');
    req.scope = { isAll: true, categoryIds: allowed, staffId: staff.id, isSalesStaff: staff.role === 'SALES_STAFF' };
    return next();
  }

  if (!allowed.includes(header)) {
    throw new ForbiddenError('Category not in your scope');
  }

  req.scope = { isAll: false, categoryIds: [header], staffId: staff.id, isSalesStaff: staff.role === 'SALES_STAFF' };
  next();
}
15.4 Frontend Scope Provider
tsx
// apps/web/src/app/providers/ScopeProvider.tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type ScopeValue = {
  categoryId: string | 'ALL';
  setCategoryId: (id: string | 'ALL') => void;
};

const ScopeContext = createContext<ScopeValue | null>(null);

export function ScopeProvider({ children, defaultCategoryId }: { children: ReactNode; defaultCategoryId: string | 'ALL' }) {
  const [categoryId, setCategoryId] = useState<string | 'ALL'>(defaultCategoryId);
  const value = useMemo(() => ({ categoryId, setCategoryId }), [categoryId]);
  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScope must be used inside <ScopeProvider>');
  return ctx;
}
15.5 Typed API Client (Scope-Injected)
ts
// apps/web/src/lib/api/client.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10_000,
  withCredentials: true,
});

// Request interceptor: attach bearer + scope
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const scope = localStorage.getItem('category_scope') ?? 'ALL';
  config.headers['X-Category-Scope'] = scope;
  return config;
});

// Response interceptor: unwrap envelope, normalise errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const envelope = err.response?.data?.error;
    if (envelope) {
      return Promise.reject(Object.assign(new Error(envelope.message), { code: envelope.code, status: err.response.status }));
    }
    return Promise.reject(err);
  },
);
15.6 Query Key Factory (Scope-Aware)
ts
// apps/web/src/lib/api/queryKeys.ts
export const qk = {
  leads: {
    list: (scope: string, filters: object, page: number) =>
      ['leads', 'list', scope, filters, page] as const,
    detail: (scope: string, id: string) =>
      ['leads', 'detail', scope, id] as const,
  },
  quotations: {
    list: (scope: string, filters: object, page: number) =>
      ['quotations', 'list', scope, filters, page] as const,
    detail: (scope: string, id: string) =>
      ['quotations', 'detail', scope, id] as const,
  },
  dashboard: {
    forecast: (scope: string, period: string) =>
      ['dashboard', 'forecast', scope, period] as const,
    leaderboard: (scope: string, period: string) =>
      ['dashboard', 'leaderboard', scope, period] as const,
  },
} as const;
15.7 RBAC Test Example
ts
// apps/api/tests/rbac/leads.spec.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { apiClient } from '../helpers/api';
import { makeStaff, makeLead, makeCategory } from '../helpers/factories';

describe('GET /leads/:id — RBAC matrix', () => {
  let superAdmin: TestUser;
  let managerA: TestUser;
  let managerB: TestUser;
  let salesA: TestUser;
  let leadA: TestLead;

  beforeAll(async () => {
    const catA = await makeCategory({ code: 'KIT' });
    const catB = await makeCategory({ code: 'BTH' });

    superAdmin = await makeStaff({ role: 'SUPER_ADMIN' });
    managerA = await makeStaff({ role: 'CATEGORY_MANAGER', categories: [catA.id] });
    managerB = await makeStaff({ role: 'CATEGORY_MANAGER', categories: [catB.id] });
    salesA = await makeStaff({ role: 'SALES_STAFF', categories: [catA.id] });

    leadA = await makeLead({ categoryId: catA.id, assignedStaffId: salesA.id });
  });

  it('200 — Super Admin, any scope', async () => {
    const res = await apiClient(superAdmin).get(`/leads/${leadA.id}`).set('X-Category-Scope', leadA.categoryId);
    expect(res.status).toBe(200);
  });

  it('200 — Super Admin, ALL scope', async () => {
    const res = await apiClient(superAdmin).get(`/leads/${leadA.id}`).set('X-Category-Scope', 'ALL');
    expect(res.status).toBe(200);
  });

  it('200 — Manager in own category', async () => {
    const res = await apiClient(managerA).get(`/leads/${leadA.id}`).set('X-Category-Scope', leadA.categoryId);
    expect(res.status).toBe(200);
  });

  it('403 — Manager in other category', async () => {
    const res = await apiClient(managerB).get(`/leads/${leadA.id}`).set('X-Category-Scope', leadA.categoryId);
    expect([403, 404]).toContain(res.status);
  });

  it('200 — Sales Staff, own lead', async () => {
    const res = await apiClient(salesA).get(`/leads/${leadA.id}`).set('X-Category-Scope', leadA.categoryId);
    expect(res.status).toBe(200);
  });

  it('404 — Sales Staff, teammate lead in same category', async () => {
    const teammateLead = await makeLead({ categoryId: leadA.categoryId, assignedStaffId: 'someone-else' });
    const res = await apiClient(salesA).get(`/leads/${teammateLead.id}`).set('X-Category-Scope', leadA.categoryId);
    expect(res.status).toBe(404);
  });

  it('401 — no auth header', async () => {
    const res = await apiClient(null).get(`/leads/${leadA.id}`).set('X-Category-Scope', leadA.categoryId);
    expect(res.status).toBe(401);
  });

  it('400 — missing scope header', async () => {
    const res = await apiClient(salesA).get(`/leads/${leadA.id}`);
    expect(res.status).toBe(400);
  });

  it('400 — malformed scope value', async () => {
    const res = await apiClient(salesA).get(`/leads/${leadA.id}`).set('X-Category-Scope', 'not-a-uuid');
    expect(res.status).toBe(400);
  });
});
End of file.

text

### How to use this with your coding agent

**Option A — System prompt injection.** Paste the entire document as part of the system prompt or the first user message when starting a session with your agent. Add: *"Treat `04_ARCHITECTURE_AND_CODING_RULES.md` as a hard constraint. If any instruction conflicts with it, stop and ask."*

**Option B — Repo-committed rule file (recommended).** Save it as `docs/04_ARCHITECTURE_AND_CODING_RULES.md` and add a top-level `AGENTS.md` (or `CLAUDE.md`, `.cursorrules`) with:

```markdown
Before writing or modifying any code, read and comply with:
- docs/01_BRD.md
- docs/02_PRD.md
- docs/03_DATA_MODEL_AND_API_SPEC.md
- docs/04_ARCHITECTURE_AND_CODING_RULES.md

The architecture rules file is binding. §6.3 (RBAC Test Matrix) and §9 (Anti-Patterns) are non-negotiable.
The four most critical sections to enforce aggressively are §2.2 (RBAC in the repository, not the UI), §5.3 (no any, strict types), §2.5 (phone/money as strings/decimals), and §6.3 (the RBAC test matrix) — these four prevent the exact classes of production bug this project exists to eliminate.