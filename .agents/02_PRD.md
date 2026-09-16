# Product Requirements Document (PRD)
## Multi-Category Lead & Quotation CRM — MVP

**Version:** 1.0
**Companion docs:** `01_BRD.md` (business rationale), `03_DATA_MODEL_AND_API_SPEC.md` (build-ready technical spec)

---

## 1. Product Summary

A web-based CRM that replaces three siloed Excel trackers. It manages **Leads**, **Quotations**, and **Staff** inside admin-defined **Categories** (business verticals), with a category selector in the top navbar that scopes the entire app, and role-based access so each user only sees what they're entitled to.

## 2. Roles & Personas

| Role | Maps to source-data pattern | Access level |
|---|---|---|
| **Super Admin** | Business owner | All categories, all leads/quotes/staff, manage categories & users |
| **Category Manager** | "Anmol Sir", "Jitender Sir", "Ishan Sir" — named people other staff route leads to | Only their assigned categor(ies); sees & manages all leads/quotes/staff **within** those categories, including reassigning leads between their staff |
| **Sales Staff** | "Varsha", "Avinash", "JD", "Mohit Dewan" — individual sheet owners | Only their assigned categor(ies) **and** only leads/quotes where they are the assigned owner |

## 3. Information Architecture / Navigation

**Top Navbar** (persistent on every page):

```
[ Logo ]   [ Category ▾ ]     Dashboard   Leads   Quotations   Staff   [ Settings ⚙ (Admin) ]     [ User ▾ ]
```

- **Category dropdown** is the global scope selector.
  - Super Admin: sees "All Categories" + every individual category.
  - Category Manager / Sales Staff: sees only the categor(ies) assigned to them (auto-selects the first / only one if they have just one).
  - Whatever category is selected filters **every** page below it — Leads, Quotations, Staff, and Dashboard — to that category's data. Selecting "All Categories" (where permitted) aggregates across all categories the user can access.
  - The selection persists across navigation within a session (stored client-side; re-applied server-side on every API call as a required scope parameter).

## 4. Pages / Screens (MVP)

### 4.1 Login
Standard email/username + password. On success, lands on Dashboard with the user's default category pre-selected.

### 4.2 Dashboard
Purpose: forecasting and performance at a glance, scoped to the selected category (or all, if permitted).

Sections:
1. **Lead Forecast** — count of leads expected, chart toggle: Weekly / Monthly / Yearly. Based on open pipeline volume and historical conversion rate (see spec doc §5 for calculation logic).
2. **Revenue Forecast** — projected revenue, same Weekly / Monthly / Yearly toggle, split into "Actual (Won)" vs "Projected (Pipeline × win-probability by stage)".
3. **Pipeline Snapshot** — count of leads by status (New, Contacted, Qualified, Site Visit Scheduled, Measurement Done, Quoted, Negotiation, On Hold, Won, Lost).
4. **Staff Performance Leaderboard** — table, sortable, filterable by time period:
   - Staff name, leads assigned, leads open, leads won, leads lost, conversion % (won / (won+lost)), total revenue closed, quotes sent.
   - Admin/Category Manager sees the full team; Sales Staff sees only their own row (read-only "my performance" card instead of a leaderboard).

### 4.3 Leads
- **List view**: table (with a Kanban-by-status toggle as a stretch goal) showing Lead ID, Customer Name, Mobile, Category, Assigned Staff, Status, Lead Type/Source, Next Follow-up, Quote Value.
  - Filters: status, assigned staff, lead type/source, date range, hot-lead flag.
  - Scoped automatically by selected Category and by the viewer's role (Sales Staff sees only their own leads).
- **Lead Detail view**:
  - Header: customer info (name, mobile x2, address), category, source/referred-by, hot-lead flag.
  - Status control: dropdown to move the lead through the pipeline; changing status appends a timeline entry automatically.
  - **Activity Timeline**: chronological, timestamped list of remarks/notes/status changes/follow-up calls (append-only) — replaces the ad hoc multi-column "REMARK / REMARK" free text seen in the legacy sheets.
  - Linked Quotations panel: list of quotations tied to this lead with quick "New Quotation" action.
  - Follow-up scheduling: next follow-up date + reminder note.
  - Lost reason field (required when status is set to Lost) and Closure Month field (required when status is set to Won).
- **Create Lead**: form capturing the fields in §5 of the technical spec. Category and Assigned Staff required; Sales Staff creating a lead is auto-assigned as owner (cannot assign to someone else unless they are a Manager/Admin).

### 4.4 Quotations
- **List view**: Quote ID, linked Lead/Customer, Category, Quote Value, Status (Draft/Shared/Accepted/Rejected/Expired/Revised), Created By, Date. Scoped by category and role exactly like Leads.
- **Quotation Builder / Detail**:
  - Must be linked to an existing Lead (created from the Lead Detail page, or standalone with a lead lookup/create-if-missing).
  - Line items table: Product Name, Product Code/Model No, Description, MRP, Offer Price, Qty, Line Total — mirrors the `QUOTATION SHEET` / `Quote sheet` structure in the legacy files, but structured instead of free text.
  - Auto-calculated Quote Total; optional Token/Advance Amount and Due Amount fields (seen in `CLOSER DETAILS`).
  - Status workflow: Draft → Shared with Customer → Accepted / Rejected → (optional) Revised (creates a new version linked to the same lead).

### 4.5 Staff
- **List view**: Name, Role, Categories assigned, Reporting Manager, Active leads count, Won count — scoped by role (Sales Staff cannot access this page except their own profile; Category Manager sees only staff in their categories).
- **Staff Detail / Profile**: contact info, role, category assignments, reporting manager, and an embedded performance summary (reuses the Dashboard leaderboard logic filtered to that one staff member).
- **Create/Edit Staff** (Admin, and Category Manager for staff within their own category): name, contact, role, category assignment(s), reporting manager.

### 4.6 Settings → Categories (Admin only)
- CRUD for Categories (name, code/prefix used for Lead IDs, active/inactive).
- Assign a Category Manager to a category.
- This is the page that ultimately powers the navbar's Category dropdown for every user.

### 4.7 My Profile
Basic account/profile page (name, contact, password change).

## 5. Role × Page Access Matrix

| Page | Super Admin | Category Manager | Sales Staff |
|---|---|---|---|
| Dashboard | All categories | Assigned categories, full team | Assigned categories, own performance only |
| Leads (list/detail) | All | Assigned categories, all leads in them | Assigned categories, own leads only |
| Create/Assign Lead | Yes, any staff | Yes, any staff within their categories | Yes, self-assigned only |
| Quotations | All | Assigned categories, all quotes in them | Assigned categories, own quotes only |
| Staff | All | Assigned categories, view/manage their staff | View own profile only |
| Settings → Categories | Yes | No | No |

(Full field-level and API-level RBAC matrix is in `03_DATA_MODEL_AND_API_SPEC.md`.)

## 6. Key User Stories (MVP)

1. As a **Sales Staff**, I can log a new lead with customer details, category, and source, so it enters my pipeline.
2. As a **Sales Staff**, I can add a timestamped remark/follow-up note to a lead so there is a running history instead of scattered "REMARK" columns.
3. As a **Sales Staff**, I can build a quotation with multiple line items linked to a lead and share its status (Draft/Shared/Accepted).
4. As a **Category Manager**, I can see every lead and quotation for staff under my category, and reassign a lead to a different staff member.
5. As a **Category Manager**, I can view a leaderboard of my team's open/closed/lost leads and revenue for the week/month/year.
6. As a **Super Admin**, I can create a new Category and assign a Category Manager to it.
7. As a **Super Admin**, I can switch the navbar category filter to "All Categories" to see company-wide dashboard numbers.
8. As any user, when I select a category from the navbar dropdown, every page (Leads, Quotations, Staff, Dashboard) updates to reflect only that category's data, with no leakage of data I'm not permitted to see.

## 7. Non-Functional Requirements

- **Security**: RBAC enforced server-side on every API call, not only hidden in the UI.
- **Data integrity**: phone numbers stored/validated as strings (not numeric types) to avoid the float-truncation issue seen in the source files; dates stored as ISO 8601, not free text.
- **Auditability**: status changes and remarks are append-only and timestamped with the acting user.
- **Performance**: dashboard aggregates should load in an acceptable time for the current data volume (source files show ~1,000–2,000 rows per sheet across ~20 sheets, i.e. low tens of thousands of leads total — well within a standard relational DB's comfort zone with basic indexing).
- **Responsiveness**: usable on desktop and tablet at minimum (mobile-responsive is a plus, not a hard MVP requirement).

## 8. Future Phases (Not in MVP)
- Guided Excel import/mapping tool for the 3 legacy workbooks.
- Configurable pipeline stages per category (Kitchen's "Design Discussion 1/2" vs Bath/Appliances' simpler flow).
- WhatsApp/SMS follow-up automation and reminders.
- PDF quotation generation & sharing.
- Cashback/incentive tracking module (seen in `Cashback` sheet).
- Lead-source analytics (Digital vs Walk-in vs Referral ROI).
