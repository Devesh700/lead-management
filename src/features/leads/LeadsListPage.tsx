import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Flame,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { LeadStatus, LeadSource, CategoryCode } from '../../types';

interface LeadsListProps {
  onNavigate: (page: string, leadId?: string) => void;
}

export const LeadsListPage: React.FC<LeadsListProps> = ({ onNavigate }) => {
  const { getFilteredLeads, addLead, staff, categories, currentStaff, activeCategory } = useData();

  const leads = getFilteredLeads();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<LeadSource[]>([]);
  const [hotOnly, setHotOnly] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // New Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryCode>(
    activeCategory !== 'ALL' ? activeCategory : 'SG'
  );
  const [newSource, setNewSource] = useState<LeadSource>('DIGITAL');
  const [newStaff, setNewStaff] = useState(currentStaff.full_name);
  const [newDesc, setNewDesc] = useState('');
  const [newHot, setNewHot] = useState(false);

  // Toggle filter arrays
  const toggleStatus = (st: LeadStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const toggleStaff = (stName: string) => {
    setSelectedStaff((prev) =>
      prev.includes(stName) ? prev.filter((s) => s !== stName) : [...prev, stName]
    );
  };

  const toggleSource = (src: LeadSource) => {
    setSelectedSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  // Filter application
  const filteredLeads = leads.filter((l) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = l.customer_name.toLowerCase().includes(term);
      const matchMobile = l.mobile_primary.includes(term);
      const matchNum = l.lead_number.toLowerCase().includes(term);
      if (!matchName && !matchMobile && !matchNum) return false;
    }
    if (hotOnly && !l.hot_lead) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(l.status)) {
      return false;
    }
    if (selectedStaff.length > 0 && !selectedStaff.includes(l.assigned_staff)) {
      return false;
    }
    if (selectedSources.length > 0 && !selectedSources.includes(l.source)) {
      return false;
    }
    return true;
  });

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newMobile) return;

    const created = addLead({
      category: categories.find((c) => c.code === newCategory)?.name || 'Saint-Gobain / UPVC',
      category_code: newCategory,
      customer_name: newCustomerName,
      mobile_primary: newMobile,
      address: newAddress,
      source: newSource,
      requirement_description: newDesc,
      hot_lead: newHot,
      assigned_staff: newStaff,
      status: 'NEW',
    });

    setShowAddModal(false);
    setNewCustomerName('');
    setNewMobile('');
    setNewAddress('');
    setNewDesc('');

    onNavigate('lead-detail', created.id);
  };

  return (
    <div className="space-y-4">
      {/* Result Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[#64748b]">
          Showing <strong className="text-[#0f172a]">{filteredLeads.length} leads</strong> in{' '}
          <strong className="text-[#0f172a]">
            {activeCategory === 'ALL' ? 'All Categories' : activeCategory}
          </strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterPanelOpen(!filterPanelOpen)}
            className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] flex items-center gap-1.5 transition"
          >
            <Filter className="w-3.5 h-3.5 text-[#2563eb]" />
            Filters
            <span className="bg-[#eff6ff] text-[#2563eb] text-[0.68rem] px-1.5 py-0.2 rounded-full font-bold">
              {selectedStatuses.length + selectedStaff.length + selectedSources.length}
            </span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* Expandable Filter Drawer Panel */}
      {filterPanelOpen && (
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <span className="text-xs font-bold text-[#0f172a] flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#2563eb]" /> Filter Leads
            </span>
            <button
              onClick={() => {
                setSelectedStatuses([]);
                setSelectedStaff([]);
                setSelectedSources([]);
              }}
              className="text-[0.72rem] font-bold text-[#dc2626] hover:underline"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Filter Group: Status */}
            <div>
              <div className="text-[0.66rem] uppercase tracking-wider font-bold text-[#64748b] mb-2">
                Status
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {[
                  'NEW',
                  'CONTACTED',
                  'QUALIFIED',
                  'MEASUREMENT_DONE',
                  'QUOTED',
                  'NEGOTIATION',
                  'ON_HOLD',
                  'WON',
                  'LOST',
                ].map((st) => (
                  <label key={st} className="flex items-center gap-2 cursor-pointer font-medium text-[#334155]">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(st as LeadStatus)}
                      onChange={() => toggleStatus(st as LeadStatus)}
                      className="accent-[#2563eb] w-3.5 h-3.5"
                    />
                    <span>{st}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Assigned Staff */}
            <div>
              <div className="text-[0.66rem] uppercase tracking-wider font-bold text-[#64748b] mb-2">
                Assigned Staff
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {staff.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer font-medium text-[#334155]">
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(s.full_name)}
                      onChange={() => toggleStaff(s.full_name)}
                      className="accent-[#2563eb] w-3.5 h-3.5"
                    />
                    <span>{s.full_name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Lead Source */}
            <div>
              <div className="text-[0.66rem] uppercase tracking-wider font-bold text-[#64748b] mb-2">
                Lead Source
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {['WALK_IN', 'DIGITAL', 'REFERRAL', 'STORE_VISIT', 'EVENT', 'OTHER'].map((src) => (
                  <label key={src} className="flex items-center gap-2 cursor-pointer font-medium text-[#334155]">
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(src as LeadSource)}
                      onChange={() => toggleSource(src as LeadSource)}
                      className="accent-[#2563eb] w-3.5 h-3.5"
                    />
                    <span>{src}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Hot Lead Toggle */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by name, mobile, or lead ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-medium outline-none focus:border-[#2563eb] focus:ring-2 ring-blue-500/10 transition"
          />
        </div>
        <label className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hotOnly}
            onChange={(e) => setHotOnly(e.target.checked)}
            className="accent-[#f59e0b] w-3.5 h-3.5"
          />
          <Flame className="w-3.5 h-3.5 text-[#f59e0b]" /> Hot leads only
        </label>
      </div>

      {/* Leads Main Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
              <tr>
                <th className="py-3 px-4">Lead</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Assigned Staff</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Next Follow-up</th>
                <th className="py-3 px-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#94a3b8]">
                    No leads match the selected scope and filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => onNavigate('lead-detail', l.id)}
                    className="hover:bg-[#f8fafc] cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#eef2ff] text-[#2563eb] font-bold flex items-center justify-center text-[0.78rem]">
                          {l.customer_name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0f172a] flex items-center gap-1.5">
                            {l.customer_name}
                            {l.hot_lead && <Flame className="w-3 h-3 text-[#f59e0b]" />}
                          </div>
                          <div className="text-[0.68rem] text-[#94a3b8] font-medium">
                            {l.lead_number} · {l.mobile_primary}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[0.66rem] font-bold rounded ${
                          l.category_code === 'SG'
                            ? 'bg-[#dbeafe] text-[#1e40af]'
                            : l.category_code === 'KIT'
                            ? 'bg-[#fef3c7] text-[#92400e]'
                            : 'bg-[#dcfce7] text-[#166534]'
                        }`}
                      >
                        {l.category_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-[#334155]">{l.assigned_staff}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[0.66rem] font-bold rounded-full uppercase ${
                          l.status === 'WON'
                            ? 'bg-[#dcfce7] text-[#166534]'
                            : l.status === 'LOST'
                            ? 'bg-[#fee2e2] text-[#991b1b]'
                            : l.status === 'QUOTED'
                            ? 'bg-[#cffafe] text-[#155e75]'
                            : l.status === 'NEGOTIATION'
                            ? 'bg-[#fef9c3] text-[#854d0e]'
                            : 'bg-[#e0e7ff] text-[#3730a3]'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#475569] font-medium">{l.source}</td>
                    <td className="py-3.5 px-3 text-[#64748b]">
                      {l.next_follow_up ? l.next_follow_up : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0f172a]">
                      {l.won_value ? `₹${l.won_value.toLocaleString('en-IN')}` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <h3 className="text-sm font-bold text-[#0f172a]">Create New Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                  Customer Name <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Gupta"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                    Mobile Primary <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10 digits"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                    Category <span className="text-[#dc2626]">*</span>
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as CategoryCode)}
                    className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">Source</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as LeadSource)}
                    className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                  >
                    <option value="DIGITAL">Digital</option>
                    <option value="WALK_IN">Walk-in</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="STORE_VISIT">Store Visit</option>
                    <option value="EVENT">Event</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                    Assigned Staff
                  </label>
                  <select
                    value={newStaff}
                    onChange={(e) => setNewStaff(e.target.value)}
                    className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                  >
                    {staff.map((s) => (
                      <option key={s.id} value={s.full_name}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                  Requirement Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Details of product or requirement..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={newHot}
                  onChange={(e) => setNewHot(e.target.checked)}
                  className="accent-[#f59e0b]"
                />
                <span>Mark as Hot Lead</span>
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-white font-semibold"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
