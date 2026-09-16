export type CategoryCode = 'BTH' | 'KIT' | 'SG';

export type UserRole = 'SUPER_ADMIN' | 'CATEGORY_MANAGER' | 'SALES_STAFF';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'SITE_VISIT_SCHEDULED'
  | 'MEASUREMENT_DONE'
  | 'QUOTED'
  | 'NEGOTIATION'
  | 'ON_HOLD'
  | 'WON'
  | 'LOST';

export type LeadSource =
  | 'WALK_IN'
  | 'DIGITAL'
  | 'REFERRAL'
  | 'STORE_VISIT'
  | 'EVENT'
  | 'OTHER';

export type QuotationStatus =
  | 'DRAFT'
  | 'SHARED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REVISED';

export interface Category {
  id: string;
  code: CategoryCode;
  name: string;
  default_manager_id: string | null;
  is_active: boolean;
}

export interface Staff {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  categories: CategoryCode[];
  reporting_manager_id: string | null;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: 'REMARK' | 'STATUS_CHANGE' | 'FOLLOW_UP' | 'CALL_LOG';
  note: string;
  old_status?: LeadStatus | null;
  new_status?: LeadStatus | null;
  created_by_staff: string;
  created_at: string;
}

export interface Lead {
  id: string;
  lead_number: string;
  category: string;
  category_code: CategoryCode;
  customer_name: string;
  mobile_primary: string;
  mobile_secondary?: string | null;
  address?: string | null;
  referred_by?: string | null;
  source: LeadSource;
  requirement_description?: string | null;
  requirement_month?: string | null;
  hot_lead: boolean;
  assigned_staff: string; // Staff full_name or staff_id
  assigned_staff_id?: string;
  status: LeadStatus;
  sub_stage?: string | null;
  won_value?: number | null;
  next_follow_up?: string | null;
  tentative_closure_month?: string | null;
  model_no?: string | null;
  lost_reason?: string | null;
  created_at: string;
  updated_at?: string;
  activities?: LeadActivity[];
}

export interface QuotationLineItem {
  id: string;
  product_name: string;
  product_code?: string;
  description?: string;
  mrp?: number;
  offer_price: number;
  quantity: number;
  line_total: number;
}

export interface Quotation {
  id: string;
  quote_number: string;
  lead_id: string;
  lead_number?: string;
  customer_name: string;
  category_code: CategoryCode;
  status: QuotationStatus;
  quote_date: string;
  valid_until?: string;
  total_amount: number;
  token_amount?: number;
  due_amount?: number;
  line_items: QuotationLineItem[];
  created_by: string;
  created_at: string;
  revision_of_id?: string | null;
}

export interface UserSession {
  user: Staff;
  active_category: CategoryCode | 'ALL';
}
