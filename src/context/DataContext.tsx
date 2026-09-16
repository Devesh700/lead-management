import React, { createContext, useContext, useEffect, useState } from 'react';
import initialData from '../data/crm_test_data.json';
import type {
  Category,
  CategoryCode,
  Lead,
  LeadActivity,
  LeadStatus,
  Quotation,
  QuotationStatus,
  Staff,
} from '../types';

interface DataContextType {
  categories: Category[];
  staff: Staff[];
  leads: Lead[];
  quotations: Quotation[];
  activeCategory: CategoryCode | 'ALL';
  currentStaff: Staff;
  setActiveCategory: (cat: CategoryCode | 'ALL') => void;
  setCurrentStaff: (staffId: string) => void;
  addLead: (lead: Omit<Lead, 'id' | 'lead_number' | 'created_at'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  updateLeadStatus: (
    id: string,
    newStatus: LeadStatus,
    note?: string,
    lostReason?: string,
    wonValue?: number
  ) => void;
  addLeadActivity: (
    leadId: string,
    activity: Omit<LeadActivity, 'id' | 'created_at'>
  ) => void;
  addQuotation: (
    quotation: Omit<Quotation, 'id' | 'quote_number' | 'created_at'>
  ) => Quotation;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  updateQuotationStatus: (id: string, status: QuotationStatus) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  getFilteredLeads: () => Lead[];
  getFilteredQuotations: () => Quotation[];
  getFilteredStaff: () => Staff[];
  resetDataToDefault: () => void;
}

const STORAGE_KEY = 'leadflow_crm_state_v1';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_categories');
    return saved ? JSON.parse(saved) : (initialData.categories as Category[]);
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_staff');
    return saved ? JSON.parse(saved) : (initialData.staff as Staff[]);
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_leads');
    return saved ? JSON.parse(saved) : (initialData.leads as Lead[]);
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_quotations');
    return saved ? JSON.parse(saved) : (initialData.quotations as Quotation[]);
  });

  const [activeCategory, setActiveCategory] = useState<CategoryCode | 'ALL'>('SG');

  const [currentStaff, setCurrentStaffState] = useState<Staff>(() => staff[1] || staff[0]);

  // Sync to localstorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_quotations', JSON.stringify(quotations));
  }, [quotations]);

  const setCurrentStaff = (staffId: string) => {
    const found = staff.find((s) => s.id === staffId);
    if (found) {
      setCurrentStaffState(found);
      // Auto switch category if staff is restricted to single category
      if (found.role !== 'SUPER_ADMIN' && found.categories.length === 1) {
        setActiveCategory(found.categories[0]);
      }
    }
  };

  const resetDataToDefault = () => {
    setCategories(initialData.categories as Category[]);
    setStaff(initialData.staff as Staff[]);
    setLeads(initialData.leads as Lead[]);
    setQuotations(initialData.quotations as Quotation[]);
    localStorage.removeItem(STORAGE_KEY + '_categories');
    localStorage.removeItem(STORAGE_KEY + '_staff');
    localStorage.removeItem(STORAGE_KEY + '_leads');
    localStorage.removeItem(STORAGE_KEY + '_quotations');
  };

  // Role & Category scoped filters
  const getFilteredLeads = (): Lead[] => {
    return leads.filter((lead) => {
      // 1. Category Scope Filter
      if (activeCategory !== 'ALL' && lead.category_code !== activeCategory) {
        return false;
      }
      // 2. Role Scoping
      if (currentStaff.role === 'SUPER_ADMIN') {
        return true;
      }
      if (currentStaff.role === 'CATEGORY_MANAGER') {
        return currentStaff.categories.includes(lead.category_code);
      }
      if (currentStaff.role === 'SALES_STAFF') {
        return (
          lead.assigned_staff === currentStaff.full_name ||
          lead.assigned_staff_id === currentStaff.id
        );
      }
      return true;
    });
  };

  const getFilteredQuotations = (): Quotation[] => {
    const accessibleLeads = getFilteredLeads().map((l) => l.id);
    return quotations.filter((q) => {
      if (activeCategory !== 'ALL' && q.category_code !== activeCategory) {
        return false;
      }
      if (currentStaff.role === 'SUPER_ADMIN') {
        return true;
      }
      return accessibleLeads.includes(q.lead_id);
    });
  };

  const getFilteredStaff = (): Staff[] => {
    return staff.filter((s) => {
      if (currentStaff.role === 'SUPER_ADMIN') return true;
      if (currentStaff.role === 'CATEGORY_MANAGER') {
        return s.categories.some((cat) => currentStaff.categories.includes(cat));
      }
      return s.id === currentStaff.id;
    });
  };

  const addLead = (leadData: Omit<Lead, 'id' | 'lead_number' | 'created_at'>): Lead => {
    const seq = leads.filter((l) => l.category_code === leadData.category_code).length + 1;
    const seqStr = String(seq).padStart(5, '0');
    const lead_number = `${leadData.category_code}-${seqStr}`;
    const newLead: Lead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      lead_number,
      created_at: new Date().toISOString().split('T')[0],
      activities: [
        {
          id: `act-${Date.now()}`,
          lead_id: `lead-${Date.now()}`,
          type: 'REMARK',
          note: 'Lead created in CRM system',
          created_by_staff: currentStaff.full_name,
          created_at: new Date().toLocaleString(),
        },
      ],
    };
    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, ...updates, updated_at: new Date().toISOString().split('T')[0] } : lead))
    );
  };

  const updateLeadStatus = (
    id: string,
    newStatus: LeadStatus,
    note?: string,
    lostReason?: string,
    wonValue?: number
  ) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== id) return lead;
        const old_status = lead.status;
        const updatedActivities = lead.activities || [];
        const newActivity: LeadActivity = {
          id: `act-${Date.now()}`,
          lead_id: id,
          type: 'STATUS_CHANGE',
          note: note || `Status changed from ${old_status} → ${newStatus}`,
          old_status,
          new_status: newStatus,
          created_by_staff: currentStaff.full_name,
          created_at: new Date().toLocaleString(),
        };

        return {
          ...lead,
          status: newStatus,
          lost_reason: lostReason ?? lead.lost_reason,
          won_value: wonValue ?? lead.won_value,
          updated_at: new Date().toISOString().split('T')[0],
          activities: [newActivity, ...updatedActivities],
        };
      })
    );
  };

  const addLeadActivity = (
    leadId: string,
    activityData: Omit<LeadActivity, 'id' | 'created_at'>
  ) => {
    const newAct: LeadActivity = {
      ...activityData,
      id: `act-${Date.now()}`,
      created_at: new Date().toLocaleString(),
    };

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          activities: [newAct, ...(lead.activities || [])],
        };
      })
    );
  };

  const addQuotation = (
    quotationData: Omit<Quotation, 'id' | 'quote_number' | 'created_at'>
  ): Quotation => {
    const seq = quotations.filter((q) => q.category_code === quotationData.category_code).length + 1;
    const seqStr = String(seq).padStart(5, '0');
    const quote_number = `${quotationData.category_code}-QT-${seqStr}`;

    const newQuote: Quotation = {
      ...quotationData,
      id: `qt-${Date.now()}`,
      quote_number,
      created_at: new Date().toISOString().split('T')[0],
    };

    setQuotations((prev) => [newQuote, ...prev]);

    addLeadActivity(quotationData.lead_id, {
      lead_id: quotationData.lead_id,
      type: 'REMARK',
      note: `Quotation ${quote_number} generated for ₹${quotationData.total_amount.toLocaleString('en-IN')}`,
      created_by_staff: currentStaff.full_name,
    });

    return newQuote;
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const updateQuotationStatus = (id: string, status: QuotationStatus) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    );
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-${categoryData.code.toLowerCase()}`,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  return (
    <DataContext.Provider
      value={{
        categories,
        staff,
        leads,
        quotations,
        activeCategory,
        currentStaff,
        setActiveCategory,
        setCurrentStaff,
        addLead,
        updateLead,
        updateLeadStatus,
        addLeadActivity,
        addQuotation,
        updateQuotation,
        updateQuotationStatus,
        addCategory,
        getFilteredLeads,
        getFilteredQuotations,
        getFilteredStaff,
        resetDataToDefault,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
