import React from 'react';
import {
  Boxes,
  PieChart,
  BarChart3,
  Users,
  FileText,
  UserCheck,
  Settings,
  UserCog,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const { currentStaff, staff, setCurrentStaff, getFilteredLeads, getFilteredQuotations } = useData();

  const accessibleLeads = getFilteredLeads();
  const accessibleQuotes = getFilteredQuotations();

  return (
    <aside className="w-[248px] bg-[#0f172a] text-[#cbd5e1] flex-shrink-0 flex flex-col sticky top-0 h-screen select-none">
      {/* Brand Header */}
      <div className="p-[22px_22px_20px] flex items-center gap-2.5 border-b border-[#1e293b]">
        <Boxes className="text-[#3b82f6] w-7 h-7" />
        <div>
          <span className="font-bold text-[#fff] text-lg tracking-tight block">LeadFlow</span>
          <small className="block text-[0.62rem] font-semibold text-[#64748b] tracking-wider uppercase -mt-1">
            CRM Suite
          </small>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3.5 pt-4 pb-1.5">
          <div className="text-[0.62rem] uppercase tracking-wider text-[#64748b] font-bold px-2 mb-2">
            Overview
          </div>
          <button
            onClick={() => setActivePage('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all mb-1 ${
              activePage === 'dashboard'
                ? 'bg-[#2563eb] text-white font-semibold shadow-sm'
                : 'text-[#cbd5e1] hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <PieChart className="w-4 h-4 text-[#94a3b8]" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActivePage('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all mb-1 ${
              activePage === 'reports'
                ? 'bg-[#2563eb] text-white font-semibold shadow-sm'
                : 'text-[#cbd5e1] hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#94a3b8]" />
            <span>Reports</span>
          </button>
        </div>

        <div className="px-3.5 pt-4 pb-1.5">
          <div className="text-[0.62rem] uppercase tracking-wider text-[#64748b] font-bold px-2 mb-2">
            Sales
          </div>
          <button
            onClick={() => setActivePage('leads')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all mb-1 ${
              activePage === 'leads' || activePage === 'lead-detail'
                ? 'bg-[#2563eb] text-white font-semibold shadow-sm'
                : 'text-[#cbd5e1] hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-[#94a3b8]" />
            <span>Leads</span>
            <span className="ml-auto bg-[#1e293b] text-[#94a3b8] text-[0.68rem] px-2 py-0.5 rounded-full font-semibold">
              {accessibleLeads.length}
            </span>
          </button>
          <button
            onClick={() => setActivePage('quotations')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all mb-1 ${
              activePage === 'quotations' || activePage === 'quotation-detail'
                ? 'bg-[#2563eb] text-white font-semibold shadow-sm'
                : 'text-[#cbd5e1] hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-[#94a3b8]" />
            <span>Quotations</span>
            <span className="ml-auto bg-[#1e293b] text-[#94a3b8] text-[0.68rem] px-2 py-0.5 rounded-full font-semibold">
              {accessibleQuotes.length}
            </span>
          </button>
        </div>

        <div className="px-3.5 pt-4 pb-1.5">
          <div className="text-[0.62rem] uppercase tracking-wider text-[#64748b] font-bold px-2 mb-2">
            Team
          </div>
          <button
            onClick={() => setActivePage('staff')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all mb-1 ${
              activePage === 'staff' || activePage === 'staff-detail'
                ? 'bg-[#2563eb] text-white font-semibold shadow-sm'
                : 'text-[#cbd5e1] hover:bg-[#1e293b] hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#94a3b8]" />
            <span>Staff</span>
          </button>
          {currentStaff.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActivePage('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all mb-1 ${
                activePage === 'settings'
                  ? 'bg-[#2563eb] text-white font-semibold shadow-sm'
                  : 'text-[#cbd5e1] hover:bg-[#1e293b] hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-[#94a3b8]" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Switcher in Sidebar Footer */}
      <div className="p-3.5 border-t border-[#1e293b]">
        <div className="text-[0.6rem] uppercase font-bold text-[#64748b] mb-1.5 flex items-center justify-between">
          <span>Active Persona (RBAC)</span>
          <UserCog className="w-3.5 h-3.5 text-[#3b82f6]" />
        </div>
        <select
          value={currentStaff.id}
          onChange={(e) => setCurrentStaff(e.target.value)}
          className="w-full bg-[#1e293b] text-xs text-white rounded-lg p-2 font-medium outline-none cursor-pointer border border-[#334155] mb-2"
        >
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name} ({s.role.replace('_', ' ')})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#1e293b]">
          <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
            {currentStaff.full_name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{currentStaff.full_name}</div>
            <div className="text-[0.62rem] text-[#94a3b8] uppercase font-bold tracking-wider truncate">
              {currentStaff.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
