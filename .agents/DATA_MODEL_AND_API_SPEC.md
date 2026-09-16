# Data Model & API Specification
## Multi-Category Lead & Quotation CRM — Build Spec for Engineering / AI Coding Agents

This document is intended to be handed directly to a coding agent (e.g. Claude Code) or an engineering team to implement the MVP described in `02_PRD.md`. It defines entities, enums, relationships, RBAC rules, and a REST API contract precisely enough to scaffold a backend and frontend without further clarification. Where a decision was inferred rather than explicitly stated by the business, it is marked `[ASSUMPTION]` so it can be confirmed or overridden.

---

## 1. Entity Relationship Overview

```
Category (1) ───< (M) StaffCategory (M) >─── (1) Staff
Category (1) ───< (M) Lead
Staff    (1) ───< (M) Lead                [assigned_staff_id]
Staff    (1) ───< (M) Staff               [reporting_manager_id, self-referencing]
Lead     (1) ───< (M) Quotation
Lead     (1) ───< (M) LeadActivity        [timeline: remarks, status changes, follow-ups]
Quotation(1) ───< (M) QuotationLineItem
User     (1) ─── (1) Staff                [every login user maps to exactly one staff record; Super Admin may or may not have a Staff record — see §2.5]
```

## 2. Entities

### 2.1 Category
Represents a business vertical (e.g. Kitchen, Saint-Gobain/UPVC, Bath & Appliances). Admin-managed, not hardcoded.

```json
{
  "id": "uuid",
  "name": "string, required, unique",
  "code": "string, required, unique, e.g. 'KIT', 'SG', 'BTH' — used as Lead/Quote ID prefix",
  "is_active": "boolean, default true",
  "default_manager_staff_id": "uuid, nullable, FK -> Staff",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 2.2 Staff
A person who logs into the system (or is managed by someone who does).

```json
{
  "id": "uuid",
  "full_name": "string, required",
  "phone": "string, required",
  "email": "string, required, unique",
  "role": "enum ['SUPER_ADMIN','CATEGORY_MANAGER','SALES_STAFF'], required",
  "reporting_manager_id": "uuid, nullable, FK -> Staff.id",
  "is_active": "boolean, default true",
  "target_revenue_monthly": "decimal, nullable  [ASSUMPTION: optional target used for performance context, not enforced in MVP]",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 2.3 StaffCategory (join table)
Implements many-to-many: a staff member can be assigned to multiple categories (mirrors legacy data where the same person appears across product lines).

```json
{
  "id": "uuid",
  "staff_id": "uuid, FK -> Staff.id, required",
  "category_id": "uuid, FK -> Category.id, required",
  "is_default": "boolean, default false  // pre-selected in navbar dropdown for this user"
}
```
Unique constraint: `(staff_id, category_id)`.

### 2.4 Lead
Core entity. Field set consolidated from `varsha`, `CLOSER DETAILS`, `Digital`, `CRM` (Kitchen) sheets.

```json
{
  "id": "uuid",
  "lead_number": "string, auto-generated, unique, format: '{category.code}-{sequence:05d}', e.g. 'KIT-00042'",
  "category_id": "uuid, FK -> Category.id, required",
  "customer_name": "string, required",
  "mobile_primary": "string, required  // stored/validated as string, NOT numeric, to avoid legacy float-truncation bug",
  "mobile_secondary": "string, nullable",
  "address": "string, nullable",
  "referred_by": "string, nullable  // free text, e.g. 'Ishan Sir', walk-in, or a person's name",
  "source": "enum ['WALK_IN','DIGITAL','REFERRAL','STORE_VISIT','EVENT','OTHER'], required",
  "requirement_description": "text, nullable  // free text of what the customer wants",
  "requirement_month": "string, nullable  // e.g. 'SEPTEMBER' — target month customer wants delivery/completion",
  "hot_lead": "boolean, default false",
  "assigned_staff_id": "uuid, FK -> Staff.id, required",
  "status": "enum (see §3.1), required, default 'NEW'",
  "sub_stage": "string, nullable  // free-text refinement within a status, e.g. Kitchen's 'Design Discussion 1' — [ASSUMPTION: kept free-text in MVP; formalize per-category in a later phase]",
  "connected": "boolean, nullable  // whether the customer picked up / responded",
  "next_follow_up_date": "date, nullable",
  "tentative_closure_month": "string, nullable",
  "lost_reason": "text, nullable  // required by application logic when status = LOST",
  "won_value": "decimal, nullable  // filled when status = WON, should reconcile with the accepted Quotation's total",
  "created_by_staff_id": "uuid, FK -> Staff.id",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 2.5 LeadActivity (Timeline)
Append-only log replacing the scattered "REMARK / REMARK" free-text columns.

```json
{
  "id": "uuid",
  "lead_id": "uuid, FK -> Lead.id, required",
  "type": "enum ['REMARK','STATUS_CHANGE','FOLLOW_UP','CALL_LOG'], required",
  "note": "text, required",
  "old_status": "enum, nullable  // populated when type = STATUS_CHANGE",
  "new_status": "enum, nullable",
  "created_by_staff_id": "uuid, FK -> Staff.id, required",
  "created_at": "datetime, required"
}
```

### 2.6 Quotation

```json
{
  "id": "uuid",
  "quote_number": "string, auto-generated, unique, format: '{category.code}-QT-{sequence:05d}'",
  "lead_id": "uuid, FK -> Lead.id, required",
  "category_id": "uuid, FK -> Category.id, required  // denormalized from lead for fast scoped queries",
  "status": "enum ['DRAFT','SHARED','ACCEPTED','REJECTED','EXPIRED','REVISED'], required, default 'DRAFT'",
  "quote_date": "date, required",
  "valid_until": "date, nullable",
  "token_amount": "decimal, nullable",
  "due_amount": "decimal, nullable  // [ASSUMPTION: computed as total - token_amount unless overridden]",
  "total_amount": "decimal, computed from line items",
  "revision_of_quotation_id": "uuid, nullable, FK -> Quotation.id  // set when status = REVISED, points to prior version",
  "created_by_staff_id": "uuid, FK -> Staff.id",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 2.7 QuotationLineItem

```json
{
  "id": "uuid",
  "quotation_id": "uuid, FK -> Quotation.id, required",
  "product_name": "string, required",
  "product_code": "string, nullable  // e.g. model no / SKU, seen as 'PRODUCT CODE' in Sheet4",
  "description": "text, nullable",
  "mrp": "decimal, nullable",
  "offer_price": "decimal, required",
  "quantity": "integer, required, default 1",
  "line_total": "decimal, computed = offer_price * quantity"
}
```

### 2.8 User (Auth)
`[ASSUMPTION]` Separated from Staff to keep auth concerns distinct, but every User maps 1:1 to a Staff record (including Super Admin — a Super Admin should still have a Staff row so they appear consistently in ownership fields if ever assigned a lead).

```json
{
  "id": "uuid",
  "staff_id": "uuid, FK -> Staff.id, required, unique",
  "email": "string, required, unique",
  "password_hash": "string, required",
  "last_login_at": "datetime, nullable"
}
```

---

## 3. Enumerations

### 3.1 Lead.status (universal pipeline, MVP)
```
NEW
CONTACTED
QUALIFIED
SITE_VISIT_SCHEDULED
MEASUREMENT_DONE
QUOTED
NEGOTIATION
ON_HOLD
WON
LOST
```
Notes:
- `ON_HOLD` and `LOST` are terminal-adjacent; `LOST` requires `lost_reason`.
- `WON` requires an `ACCEPTED` Quotation linked to the lead; `won_value` should be set from that quotation's `total_amount`.
- Legacy status values observed and their mapping for import purposes:
  - `LEAD`, `PROSPECTED LEAD` → `NEW`
  - `DESIGN DISCUSSION 1`, `DESIGN DISCUSSION 2` → `NEGOTIATION` (status) + value copied into `sub_stage`
  - `MEASUREMENT DONE` → `MEASUREMENT_DONE`
  - `BOOKED` → `WON`
  - `HOLD` → `ON_HOLD`
  - `LOST` → `LOST`
  - `warm` / `cold` (Saint-Gobain "Qt-Stage") → `CONTACTED` / `QUALIFIED` respectively + original value into `sub_stage`

### 3.2 Lead.source
```
WALK_IN     // legacy "WLK"
DIGITAL     // legacy "DIGITAL", "digital", "GOOGLE"
REFERRAL    // legacy "REFFERED BY" populated, or "local lead"
STORE_VISIT
EVENT
OTHER
```

### 3.3 Quotation.status
```
DRAFT
SHARED
ACCEPTED
REJECTED
EXPIRED
REVISED
```

### 3.4 Staff.role
```
SUPER_ADMIN
CATEGORY_MANAGER
SALES_STAFF
```

---

## 4. Role-Based Access Control (RBAC) — Enforcement Rules

RBAC MUST be enforced in the API layer (middleware), not only hidden in the UI.

### 4.1 Scope resolution (applies to every request)
1. Determine `current_staff` from the authenticated session.
2. Determine `active_category_id` from the request (navbar selection, passed as a required query param/header on scoped endpoints, e.g. `X-Category-Scope`).
3. Validate `active_category_id` is one the `current_staff` is permitted to access:
   - `SUPER_ADMIN`: any category, or the special value `ALL` to aggregate.
   - `CATEGORY_MANAGER` / `SALES_STAFF`: must exist in that staff's `StaffCategory` rows, or `ALL` if they have more than one assigned category (aggregates only across their own assigned categories, never others').
   - Reject with `403` if not permitted.

### 4.2 Row-level rules by role

| Entity | SUPER_ADMIN | CATEGORY_MANAGER | SALES_STAFF |
|---|---|---|---|
| Category | full CRUD | read-only (their own) | read-only (their own) |
| Staff | full CRUD, any category | CRUD for staff **within their categories** only; cannot edit Super Admins | read own profile only (read-only) |
| Lead | full CRUD, any category | full CRUD for leads where `lead.category_id` ∈ their categories | CRUD only where `lead.assigned_staff_id == current_staff.id` AND `lead.category_id` ∈ their categories |
| LeadActivity | create/read, any lead they can see | create/read, leads within their categories | create/read, only their own leads |
| Quotation | full CRUD, any category | full CRUD within their categories | CRUD only for quotations on leads they own |
| Dashboard aggregates | any category / ALL | their categories / ALL (aggregated across only their categories) | their categories, personal metrics only (no team leaderboard) |

### 4.3 Field-level rule
- `Lead.assigned_staff_id` reassignment: only `SUPER_ADMIN` and `CATEGORY_MANAGER` (within their category) may change this field. `SALES_STAFF` cannot reassign a lead away from or to themselves.

---

## 5. Dashboard Calculation Logic

### 5.1 Revenue — Actual
`SUM(Lead.won_value) WHERE Lead.status = 'WON' AND Lead.updated_at (or a dedicated won_at timestamp) falls within the selected period`, scoped by category/role per §4.

`[ASSUMPTION]` Add a `won_at` timestamp field to Lead (distinct from `updated_at`) captured at the moment status transitions to `WON`, so revenue-by-period is based on when it was won, not last-edited time.

### 5.2 Revenue — Forecast (Projected Pipeline)
`SUM(Quotation.total_amount) for the latest quotation per open Lead, WHERE Lead.status NOT IN ('WON','LOST')`, weighted by a stage-probability table:

| Status | Default win probability `[ASSUMPTION, admin-configurable later]` |
|---|---|
| NEW | 5% |
| CONTACTED | 10% |
| QUALIFIED | 20% |
| SITE_VISIT_SCHEDULED | 35% |
| MEASUREMENT_DONE | 45% |
| QUOTED | 55% |
| NEGOTIATION | 70% |
| ON_HOLD | 15% |

`Forecast Revenue = Σ (open_lead.latest_quote_value_or_estimate × probability[open_lead.status])`

### 5.3 Lead Forecast (count)
`Forecast Lead Count for period = open_pipeline_count × historical_conversion_rate`, where `historical_conversion_rate = WON / (WON + LOST)` over the trailing comparable period (e.g. trailing 90 days for a monthly forecast). Present alongside raw open pipeline count so the number is auditable.

### 5.4 Time bucketing
All Weekly/Monthly/Yearly toggles use the same underlying query with a different `GROUP BY DATE_TRUNC('week'|'month'|'year', <relevant date field>)`.

### 5.5 Staff Performance Leaderboard
Per staff, per selected period and category scope:
```
leads_assigned   = COUNT(Lead) WHERE assigned_staff_id = staff.id
leads_open       = COUNT(Lead) WHERE assigned_staff_id = staff.id AND status NOT IN ('WON','LOST')
leads_won        = COUNT(Lead) WHERE assigned_staff_id = staff.id AND status = 'WON' AND won_at in period
leads_lost       = COUNT(Lead) WHERE assigned_staff_id = staff.id AND status = 'LOST' AND updated_at in period
conversion_rate  = leads_won / NULLIF(leads_won + leads_lost, 0)
revenue_closed   = SUM(Lead.won_value) WHERE assigned_staff_id = staff.id AND won_at in period
quotes_sent      = COUNT(Quotation) WHERE created_by_staff_id = staff.id AND status != 'DRAFT' AND quote_date in period
```

---

## 6. REST API Contract (MVP)

Base path: `/api/v1`. All endpoints require auth (`Authorization: Bearer <token>`) except `/auth/login`. All list/detail endpoints for Category-scoped entities require `X-Category-Scope: <category_id | ALL>` and apply §4 rules.

| Method | Path | Purpose | Roles |
|---|---|---|---|
| POST | `/auth/login` | Authenticate, return token + staff profile + accessible categories | All |
| GET | `/me` | Current user profile + role + accessible categories | All |
| GET | `/categories` | List categories accessible to current user | All (scoped) |
| POST | `/categories` | Create category | SUPER_ADMIN |
| PATCH | `/categories/{id}` | Update category | SUPER_ADMIN |
| GET | `/staff` | List staff (scoped) | SUPER_ADMIN, CATEGORY_MANAGER |
| POST | `/staff` | Create staff | SUPER_ADMIN, CATEGORY_MANAGER (own category only) |
| GET | `/staff/{id}` | Staff profile + performance summary | SUPER_ADMIN, CATEGORY_MANAGER (own team), SALES_STAFF (self only) |
| PATCH | `/staff/{id}` | Update staff | SUPER_ADMIN, CATEGORY_MANAGER (own team) |
| GET | `/leads` | List leads (filters: status, assigned_staff_id, source, date range, hot_lead) | All (row-scoped per §4.2) |
| POST | `/leads` | Create lead | All (SALES_STAFF auto-assigns self) |
| GET | `/leads/{id}` | Lead detail incl. activity timeline & linked quotations | All (row-scoped) |
| PATCH | `/leads/{id}` | Update lead fields / status | All (row-scoped); reassignment restricted per §4.3 |
| POST | `/leads/{id}/activities` | Add remark / follow-up / call log | All (row-scoped) |
| GET | `/quotations` | List quotations (filters: status, lead_id, date range) | All (row-scoped) |
| POST | `/quotations` | Create quotation (with line items) | All (row-scoped to own leads for SALES_STAFF) |
| GET | `/quotations/{id}` | Quotation detail incl. line items | All (row-scoped) |
| PATCH | `/quotations/{id}` | Update quotation / status / line items | All (row-scoped) |
| GET | `/dashboard/forecast` | Revenue + lead forecast, params: `period=weekly|monthly|yearly` | All (scoped; SALES_STAFF gets personal-only) |
| GET | `/dashboard/leaderboard` | Staff performance table, params: `period=...` | SUPER_ADMIN, CATEGORY_MANAGER |
| GET | `/dashboard/pipeline-snapshot` | Lead counts by status | All (scoped) |

---

## 7. Data Migration Notes (for the one-time legacy import, out of MVP build scope but informs schema choices)

- Normalize all mobile numbers to string, strip non-digits, validate length before insert (source data has numbers stored as floats — precision loss must be corrected, not carried forward).
- Map free-text category/customer-type values (`APPLIANCES`, `APLLIANCES`, `APPLINCES`, etc.) to a fixed `Category` list via a manual lookup table before import — do not auto-create categories from raw text.
- Map free-text `LEAD TYPE` values (`WLK`, `wlk`, `DIGITAL`, `digital`, `SIDE VISIT`, `GOOGLE`, `MBT`, `SD`, `OLD LEAD`, `EVENT`, `local lead`) to the fixed `Lead.source` enum using a lookup table; anything ambiguous defaults to `OTHER` and is flagged for manual review.
- Multiple "REMARK" columns per row (e.g. `varsha` sheet has two columns both named `REMARK`) should each become a separate `LeadActivity` row of type `REMARK`, timestamped at import time with a note indicating "(imported)".
- Per-staff sheets (`varsha`, `Avinash`, `Anmol Ragahv`, `JD LEADS`, `JITENDER SIR`, `ANMOL SIR LEAD`) map to `Lead.assigned_staff_id` = that staff's new `Staff.id`, and `Lead.category_id` = the workbook's category.
