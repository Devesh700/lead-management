import React from 'react';
import { Filter, Bell, HelpCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { CategoryCode } from '../../types';

interface TopbarProps {
  activePage: string;
}

const titles: Record<string, [string, string]> = {
  dashboard: ['Dashboard', 'Performance & Pipeline Forecast'],
  reports: ['Reports', 'Performance analytics & Category breakdown'],
  leads: ['Leads', 'Pipeline Leads & Management'],
  'lead-detail': ['Lead Detail', 'Customer Details & Activity Timeline'],
  quotations: ['Quotations', 'Quotations & Proposal Tracking'],
  'quotation-detail': ['Quotation Detail', 'Line Items & Status History'],
  staff: ['Staff', 'Team Members & Performance Metrics'],
  'staff-detail': ['Staff Detail', 'Individual Profile & assigned pipeline'],
  settings: ['Settings', 'Categories & System Configuration'],
};

export const Topbar: React.FC<TopbarProps> = ({ activePage }) => {
  const { activeCategory, setActiveCategory, categories, currentStaff } = useData();

  const titleInfo = titles[activePage] || ['LeadFlow CRM', 'Multi-Category System'];

  const allowedCategories =
    currentStaff.role === 'SUPER_ADMIN'
      ? categories
      : categories.filter((c) => currentStaff.categories.includes(c.code));

  return (
    <header className="bg-white border-b border-[#e2e8f0] px-6 flex items-center gap-4 sticky top-0 z-50 h-[62px]">
      <div>
        <h1 className="text-base font-bold text-[#0f172a] leading-tight flex items-center gap-2">
          {titleInfo[0]}
        </h1>
        <small className="block text-[0.72rem] font-medium text-[#64748b]">
          {activeCategory === 'ALL'
            ? 'All Categories'
            : categories.find((c) => c.code === activeCategory)?.name || activeCategory}{' '}
          · {titleInfo[1]}
        </small>
      </div>

      {/* Scope Picker Dropdown */}
      <div className="ml-auto flex items-center gap-2 bg-[#f1f5f9] border border-[#e2e8f0] px-3 py-1.5 rounded-xl">
        <Filter className="w-3.5 h-3.5 text-[#2563eb]" />
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value as CategoryCode | 'ALL')}
          className="border-none bg-transparent text-xs font-semibold text-[#0f172a] outline-none cursor-pointer pr-1"
        >
          {currentStaff.role === 'SUPER_ADMIN' || currentStaff.categories.length > 1 ? (
            <option value="ALL">All Categories</option>
          ) : null}
          {allowedCategories.map((c) => (
            <option key={c.id} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
        <span className="text-[0.62rem] uppercase font-bold text-[#64748b] bg-white px-1.5 py-0.5 rounded border border-[#e2e8f0]">
          Scope
        </span>
      </div>

      <button className="w-9 h-9 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] transition">
        <Bell className="w-4 h-4" />
      </button>
      <button className="w-9 h-9 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#475569] hover:bg-[#e2e8f0] transition">
        <HelpCircle className="w-4 h-4" />
      </button>
    </header>
  );
};
