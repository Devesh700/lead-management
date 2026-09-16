# Business Requirements Document (BRD)
## Multi-Category Lead & Quotation CRM

**Version:** 1.0 (MVP)
**Status:** Draft for review
**Source input:** Review of 3 existing operational trackers — `LEAD-REVIEW_-SYSTEM.xlsx`, `_KITCHEN_LEAD_TRACKER.xlsx`, `Saint_Gobain_Lead_Tracker.xlsx`

---

## 1. Background

The business currently runs sales for at least three distinct product lines / categories out of separate Excel workbooks, each maintained largely by hand:

| Observed workbook | Represents category | Evidence |
|---|---|---|
| `_KITCHEN_LEAD_TRACKER.xlsx` | Modular Kitchen (e.g. Hafele) | `CRM` sheet: STORE, CLIENT NAME, LEAD ASIGNED, STATUS (LEAD/PROSPECTED LEAD/MEASUREMENT DONE/DESIGN DISCUSSION 1/2/BOOKED/LOST/HOLD) |
| `Saint_Gobain_Lead_Tracker.xlsx` | Saint-Gobain Glass / UPVC Windows | Sheets per staff (`JD LEADS`, `JITENDER SIR`, `ANMOL SIR LEAD`), `Digital` leads sheet, `Quote sheet`, `Quotes New` |
| `LEAD-REVIEW_-SYSTEM.xlsx` | Bath fittings, Sanitaryware & Appliances | Sheets per staff (`varsha`, `Avinash`, `Anmol Ragahv`), `QUOTATION SHEET`, `CLOSER DETAILS`, `LOST`, `Cashback` |

Within these files we also see the same underlying entities repeated with inconsistent structure: a **Lead**, a **Quotation**, a **Staff member**, and a **Category/Product type**.

## 2. Problem Statement

1. **Data fragmentation** — Leads, quotes, and staff performance live in 3 separate workbooks and ~20 sheets, one per staff member or sub-team, with no single source of truth.
2. **No standardized taxonomy** — Free-text fields produce dozens of spelling variants for the same value, e.g. customer/category type is entered as `APPLIANCES`, `APLLIANCES`, `APPLINCES`, `APLIANCES`, `APPIIANCES`, `APPLICANCES` in a single column of one sheet. Lead status differs by sheet (`LEAD`, `PROSPECTED LEAD`, `BOOKED` in Kitchen vs `warm`/`cold`/`Lost` in Saint-Gobain Quotes).
3. **Data integrity issues** — Mobile numbers stored as floating-point numbers (risk of truncation/scientific notation), duplicate `SO.NO` sequences per sheet, dates stored as text in mixed formats (`27/12/2025`, `13/01/2026`), some cells with corrupted/out-of-range serial values.
4. **No cross-category visibility** — Management cannot see total pipeline, forecast revenue, or staff performance across categories without manually building pivot tables (seen in `Sheet5`/`Pivot Table 2`).
5. **No access control** — Any staff member with the file can see/edit everyone's leads; there is no way to restrict a salesperson to their own leads or a manager to their team's leads.
6. **No forecasting** — There is no systematic weekly/monthly/yearly revenue or lead forecast; only static historical totals.
7. **Manual quotation building** — Quotations are built ad hoc per sheet (`QUOTATION SHEET`, `Quote sheet`, `Quotes New`) with different column sets, no linkage guaranteed back to the originating lead, and no version/status tracking (Draft/Sent/Accepted).

## 3. Business Objectives

| # | Objective | Success Metric |
|---|---|---|
| O1 | Consolidate all leads, quotations and staff activity into one system | 100% of new leads entered directly into the CRM within 30 days of launch |
| O2 | Provide category-level isolation so each vertical's data can be managed and viewed independently | Category filter available on every data page; zero cross-category data leakage to unauthorized roles |
| O3 | Provide role-based access so staff only see their own book of business, managers see their team, admins see everything | RBAC enforced at both UI and API layer; verified via access audit |
| O4 | Give management a real-time forecasting dashboard (leads & revenue: weekly/monthly/yearly) | Dashboard replaces manual pivot-table reporting entirely |
| O5 | Surface staff performance (leads owned, open, closed-won, closed-lost, conversion rate, revenue) | Leaderboard/ranking view available to Admin & Category Managers |
| O6 | Standardize data entry (status, lead type, category) to eliminate free-text variants | All classification fields are dropdown/enum-driven, not free text |
| O7 | Preserve full history/audit trail per lead (remarks, status changes, follow-ups) | Every lead has a timestamped activity/remarks timeline |

## 4. Stakeholders

| Role | Description | Primary Needs |
|---|---|---|
| Super Admin / Business Owner | Owns the business across all categories | Full visibility, user & category management, company-wide forecast |
| Category Manager (e.g. "Anmol Sir", "Jitender Sir" in source data) | Owns one or more categories, supervises a team of sales staff | Team pipeline, team performance, reassignment of leads, quotation approval |
| Sales Staff (e.g. "Varsha", "Avinash", "JD") | Individual salesperson working leads day to day | Their own leads, ability to log calls/remarks, build quotations, track their own targets |

## 5. Scope

### 5.1 In Scope (MVP)
- Lead management (create, update, assign, status/stage tracking, remarks/timeline, follow-ups)
- Quotation management (line items, pricing, status, link to lead)
- Staff management (profiles, category assignment, reporting hierarchy)
- Category management (admin-defined business verticals used for data isolation)
- Category-scoped navigation (top navbar dropdown filters the whole app to a category)
- Role-based access control (Super Admin, Category Manager, Sales Staff) enforced on pages and APIs
- Dashboard: lead forecast and revenue forecast (weekly/monthly/yearly), staff performance leaderboard

### 5.2 Out of Scope (MVP) — candidate for later phases
- Automated Excel import/migration tooling (a one-time manual/assisted import is assumed)
- WhatsApp/SMS/Email/call-integration for lead follow-up automation
- PDF generation & e-signature for quotations
- Customer-facing portal
- Payment/invoicing/accounting integration
- Configurable per-category pipeline stages (MVP ships one universal status set + a free-text sub-stage)
- Mobile app (MVP is responsive web)

## 6. Assumptions
- One company/tenant; multi-tenant SaaS is not required for MVP.
- A category maps 1:1 to a "vertical" such as Kitchen, Saint-Gobain/UPVC, Bath & Appliances — but categories are admin-configurable, not hardcoded, so the business can add/rename verticals later.
- A staff member can belong to more than one category (mirrors source data where e.g. "Anmol" appears both in the Saint-Gobain file and referenced inside the Bath/Appliances file).
- Currency is INR; figures observed in source data (e.g. quote values, cashback) are in Indian Rupees.

## 7. Risks
| Risk | Mitigation |
|---|---|
| Legacy data is inconsistent (see Problem Statement) and will need cleanup before import | Define a data-cleaning/mapping pass as a pre-launch task; do not auto-import raw free text into enum fields |
| Staff resistance to structured data entry vs. free-text habits | Keep required fields minimal in MVP; allow a free-text "remarks" field alongside structured fields |
| Role/category scoping bugs could leak data across teams | RBAC must be enforced server-side (API), not just hidden in UI |

## 8. Approval
This BRD is a starting point derived from the uploaded trackers and the stated requirements. It should be reviewed by the business owner and category managers before the PRD is finalized for build.
