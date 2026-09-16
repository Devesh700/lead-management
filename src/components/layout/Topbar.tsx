import React, { useState, useRef, useEffect } from 'react';
import { Filter, Bell, HelpCircle, ChevronDown, Check } from 'lucide-react';
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
  const { activeCategories, toggleCategoryScope, setActiveCategories, categories, currentStaff } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const titleInfo = titles[activePage] || ['LeadFlow CRM', 'Multi-Category System'];

  const allowedCategories =
    currentStaff.role === 'SUPER_ADMIN'
      ? categories
      : categories.filter((c) => currentStaff.categories.includes(c.code));

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = activeCategories.includes('ALL') || activeCategories.length === allowedCategories.length;

  const getSummaryLabel = () => {
    if (isAllSelected) return `All Categories (${allowedCategories.length})`;
    if (activeCategories.length === 1) {
      const match = categories.find((c) => c.code === activeCategories[0]);
      return match ? `${match.name} (${match.code})` : activeCategories[0];
    }
    return `${activeCategories.length} Categories Selected`;
  };

  return (
    <header className="bg-white border-b border-[#e2e8f0] px-6 flex items-center gap-4 sticky top-0 z-50 h-[62px]">
      <div>
        <h1 className="text-base font-bold text-[#0f172a] leading-tight flex items-center gap-2">
          {titleInfo[0]}
        </h1>
        <small className="block text-[0.72rem] font-medium text-[#64748b]">
          {getSummaryLabel()} · {titleInfo[1]}
        </small>
      </div>

      {/* Multi-Select Category Scope Picker Dropdown */}
      <div className="ml-auto relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] border border-[#cbd5e1] px-3 py-1.5 rounded-xl transition text-xs font-semibold text-[#0f172a] shadow-2xs"
        >
          <Filter className="w-3.5 h-3.5 text-[#2563eb]" />
          <span className="truncate max-w-[200px]">{getSummaryLabel()}</span>
          <span className="text-[0.62rem] uppercase font-bold text-[#64748b] bg-white px-1.5 py-0.5 rounded border border-[#e2e8f0] ml-1">
            Scope
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#64748b] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#e2e8f0] z-50 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
              <span className="font-bold text-[#0f172a] text-[0.75rem] uppercase tracking-wider">
                Filter by Category
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategories(['ALL'])}
                  className="text-[0.68rem] text-[#2563eb] font-bold hover:underline"
                >
                  Select All
                </button>
              </div>
            </div>

            {/* Checkbox List */}
            <div className="space-y-1 max-h-56 overflow-y-auto pt-1">
              {/* All Categories Option */}
              <label
                onClick={() => toggleCategoryScope('ALL')}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f8fafc] cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                      isAllSelected
                        ? 'bg-[#2563eb] border-[#2563eb] text-white'
                        : 'border-[#cbd5e1] bg-white'
                    }`}
                  >
                    {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="font-bold text-[#0f172a]">All Categories</span>
                </div>
                <span className="text-[0.66rem] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded">
                  ALL
                </span>
              </label>

              <hr className="my-1 border-[#f1f5f9]" />

              {/* Individual Category Checkboxes */}
              {allowedCategories.map((c) => {
                const isChecked = isAllSelected || activeCategories.includes(c.code);
                return (
                  <label
                    key={c.id}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleCategoryScope(c.code as CategoryCode);
                    }}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f8fafc] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                          isChecked
                            ? 'bg-[#2563eb] border-[#2563eb] text-white'
                            : 'border-[#cbd5e1] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="font-medium text-[#334155]">{c.name}</span>
                    </div>
                    <span
                      className={`text-[0.66rem] font-bold px-2 py-0.5 rounded ${
                        c.code === 'SG'
                          ? 'bg-[#dbeafe] text-[#1e40af]'
                          : c.code === 'KIT'
                          ? 'bg-[#fef3c7] text-[#92400e]'
                          : 'bg-[#dcfce7] text-[#166534]'
                      }`}
                    >
                      {c.code}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#f1f5f9] flex items-center justify-between text-[0.68rem] text-[#64748b]">
              <span>Active scope: <strong>{isAllSelected ? 'ALL' : activeCategories.join(', ')}</strong></span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] font-bold rounded-md"
              >
                Done
              </button>
            </div>
          </div>
        )}
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
