import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Flame,
  X,
  Download,
  CheckSquare,
  Sparkles,
  Grid,
  List,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { LeadStatus, LeadSource, CategoryCode, Lead } from '../../types';

interface LeadsListProps {
  onNavigate: (page: string, leadId?: string) => void;
}

export const LeadsListPage: React.FC<LeadsListProps> = ({ onNavigate }) => {
  const {
    getFilteredLeads,
    addLead,
    updateLeadStatus,
    staff,
    categories,
    currentStaff,
    activeCategory,
  } = useData();

  const leads = getFilteredLeads();

  // Excel preset tabs
  const [activeTab, setActiveTab] = useState<'all' | 'pipeline' | 'hot' | 'won' | 'lost'>('all');
  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<LeadStatus[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<LeadSource[]>([]);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [showHelperBanner, setShowHelperBanner] = useState(true);

  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

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

  // Bulk select handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    } else {
      setSelectedLeadIds([]);
    }
  };

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk batch status change
  const handleBatchStatusChange = (status: LeadStatus) => {
    selectedLeadIds.forEach((id) => {
      updateLeadStatus(id, status, `Batch status update to ${status}`);
    });
    setSelectedLeadIds([]);
  };

  // CSV Export function
  const handleExportCSV = (dataToExport: Lead[]) => {
    const headers = [
      'Lead Number',
      'Customer Name',
      'Primary Mobile',
      'Category Code',
      'Assigned Staff',
      'Status',
      'Source',
      'Won Value (INR)',
      'Created Date',
    ];
    const rows = dataToExport.map((l) => [
      l.lead_number,
      `"${l.customer_name}"`,
      l.mobile_primary,
      l.category_code,
      `"${l.assigned_staff}"`,
      l.status,
      l.source,
      l.won_value || '',
      l.created_at,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `leads_export_${activeCategory}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter application
  const filteredLeads = leads.filter((l) => {
    // Tab filter
    if (activeTab === 'pipeline' && (l.status === 'WON' || l.status === 'LOST')) return false;
    if (activeTab === 'hot' && !l.hot_lead) return false;
    if (activeTab === 'won' && l.status !== 'WON') return false;
    if (activeTab === 'lost' && l.status !== 'LOST') return false;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = l.customer_name.toLowerCase().includes(term);
      const matchMobile = l.mobile_primary.includes(term);
      const matchNum = l.lead_number.toLowerCase().includes(term);
      if (!matchName && !matchMobile && !matchNum) return false;
    }

    // Custom Filters
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(l.status)) return false;
    if (selectedStaff.length > 0 && !selectedStaff.includes(l.assigned_staff)) return false;
    if (selectedSources.length > 0 && !selectedSources.includes(l.source)) return false;

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
      {/* Excel Migration Onboarding Banner */}
      {showHelperBanner && (
        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-2xl p-4 flex items-center justify-between text-xs text-[#1e40af] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2563eb] text-white flex items-center justify-center font-bold flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">Excel User Quick Guide:</span> You can edit statuses directly in table cells, multi-select rows for batch updates, switch to Compact Grid view, or export to CSV anytime!
            </div>
          </div>
          <button
            onClick={() => setShowHelperBanner(false)}
            className="text-[#3b82f6] hover:text-[#1d4ed8] p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Excel Sheet Tabs & Utility Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] pb-2">
        {/* Preset Tabs */}
        <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All Leads', count: leads.length },
            {
              id: 'pipeline',
              label: 'Open Pipeline',
              count: leads.filter((l) => l.status !== 'WON' && l.status !== 'LOST').length,
            },
            { id: 'hot', label: 'Hot Leads', count: leads.filter((l) => l.hot_lead).length },
            { id: 'won', label: 'Won Deals', count: leads.filter((l) => l.status === 'WON').length },
            { id: 'lost', label: 'Lost', count: leads.filter((l) => l.status === 'LOST').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white text-[#0f172a] shadow-xs font-bold'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[0.62rem] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeTab === tab.id ? 'bg-[#2563eb] text-white' : 'bg-[#e2e8f0] text-[#475569]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* View Density & Export Action */}
        <div className="flex items-center gap-2">
          {/* Grid View Density Toggle */}
          <div className="flex bg-[#f1f5f9] p-1 rounded-lg text-xs border border-[#e2e8f0]">
            <button
              onClick={() => setViewDensity('comfortable')}
              title="Comfortable View"
              className={`p-1 rounded ${
                viewDensity === 'comfortable' ? 'bg-white shadow-xs text-[#2563eb]' : 'text-[#64748b]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewDensity('compact')}
              title="Compact Excel Grid View"
              className={`p-1 rounded ${
                viewDensity === 'compact' ? 'bg-white shadow-xs text-[#2563eb]' : 'text-[#64748b]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => handleExportCSV(filteredLeads)}
            className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-[#16a34a]" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* Batch Floating Toolbar when Rows are Selected */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-[#0f172a] text-white rounded-xl p-3 px-4 flex items-center justify-between text-xs shadow-lg animate-fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckSquare className="w-4 h-4 text-[#3b82f6]" />
            <span>{selectedLeadIds.length} Leads Selected</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#94a3b8]">Batch Update Status:</span>
            <select
              onChange={(e) => {
                if (e.target.value) handleBatchStatusChange(e.target.value as LeadStatus);
              }}
              defaultValue=""
              className="bg-[#1e293b] text-white px-2.5 py-1 rounded-lg border border-[#334155] outline-none font-semibold cursor-pointer"
            >
              <option value="" disabled>
                Select Status...
              </option>
              {['NEW', 'CONTACTED', 'QUALIFIED', 'MEASUREMENT_DONE', 'QUOTED', 'NEGOTIATION', 'ON_HOLD', 'WON', 'LOST'].map(
                (st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                )
              )}
            </select>
            <button
              onClick={() => handleExportCSV(leads.filter((l) => selectedLeadIds.includes(l.id)))}
              className="px-2.5 py-1 bg-[#16a34a] text-white font-bold rounded-lg hover:bg-[#15803d]"
            >
              Export Selected
            </button>
            <button
              onClick={() => setSelectedLeadIds([])}
              className="text-[#94a3b8] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar & Custom Filters Toggle */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by name, mobile, or lead ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-medium outline-none focus:border-[#2563eb] transition"
          />
        </div>

        <button
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
            filterPanelOpen
              ? 'bg-[#2563eb] text-white border-[#2563eb]'
              : 'bg-white border-[#e2e8f0] text-[#334155] hover:bg-[#f8fafc]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          Advanced Filters
          <span className="bg-[#eff6ff] text-[#2563eb] text-[0.68rem] px-1.5 py-0.2 rounded-full font-bold">
            {selectedStatuses.length + selectedStaff.length + selectedSources.length}
          </span>
        </button>
      </div>

      {/* Advanced Filter Drawer */}
      {filterPanelOpen && (
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <span className="text-xs font-bold text-[#0f172a] flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#2563eb]" /> Column Filters
            </span>
            <button
              onClick={() => {
                setSelectedStatuses([]);
                setSelectedStaff([]);
                setSelectedSources([]);
              }}
              className="text-[0.72rem] font-bold text-[#dc2626] hover:underline"
            >
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-[0.66rem] uppercase tracking-wider font-bold text-[#64748b] mb-2">
                Pipeline Status
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {['NEW', 'CONTACTED', 'QUALIFIED', 'MEASUREMENT_DONE', 'QUOTED', 'NEGOTIATION', 'ON_HOLD', 'WON', 'LOST'].map(
                  (st) => (
                    <label key={st} className="flex items-center gap-2 cursor-pointer font-medium text-[#334155]">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(st as LeadStatus)}
                        onChange={() => toggleStatus(st as LeadStatus)}
                        className="accent-[#2563eb] w-3.5 h-3.5"
                      />
                      <span>{st}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <div className="text-[0.66rem] uppercase tracking-wider font-bold text-[#64748b] mb-2">
                Assigned Sales Staff
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

      {/* Main Grid Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length
                    }
                    onChange={handleSelectAll}
                    className="accent-[#2563eb] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Lead Customer</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Assigned Staff</th>
                <th className="py-3 px-3">Status (Inline Edit)</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Next Follow-up</th>
                <th className="py-3 px-4 text-right">Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94a3b8]">
                    No leads match the selected scope and filters.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l) => {
                  const isSelected = selectedLeadIds.includes(l.id);
                  return (
                    <tr
                      key={l.id}
                      onClick={() => onNavigate('lead-detail', l.id)}
                      className={`hover:bg-[#f8fafc] cursor-pointer transition ${
                        isSelected ? 'bg-[#eff6ff]' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center" onClick={(e) => handleSelectRow(l.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="accent-[#2563eb] cursor-pointer"
                        />
                      </td>

                      <td className={`px-4 ${viewDensity === 'compact' ? 'py-2' : 'py-3'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#eef2ff] text-[#2563eb] font-bold flex items-center justify-center text-[0.78rem] flex-shrink-0">
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

                      <td className={`px-3 ${viewDensity === 'compact' ? 'py-2' : 'py-3'}`}>
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

                      <td className={`px-3 ${viewDensity === 'compact' ? 'py-2' : 'py-3'} font-medium text-[#334155]`}>
                        {l.assigned_staff}
                      </td>

                      {/* INLINE STATUS DROPDOWN (Direct Excel-style editing!) */}
                      <td
                        className={`px-3 ${viewDensity === 'compact' ? 'py-2' : 'py-3'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={l.status}
                          onChange={(e) =>
                            updateLeadStatus(l.id, e.target.value as LeadStatus, `Inline status update`)
                          }
                          className={`px-2.5 py-1 text-[0.68rem] font-bold rounded-lg border outline-none cursor-pointer uppercase ${
                            l.status === 'WON'
                              ? 'bg-[#dcfce7] text-[#166534] border-[#86efac]'
                              : l.status === 'LOST'
                              ? 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
                              : l.status === 'QUOTED'
                              ? 'bg-[#cffafe] text-[#155e75] border-[#a5f3fc]'
                              : l.status === 'NEGOTIATION'
                              ? 'bg-[#fef9c3] text-[#854d0e] border-[#fef08a]'
                              : 'bg-[#e0e7ff] text-[#3730a3] border-[#c7d2fe]'
                          }`}
                        >
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
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className={`px-3 ${viewDensity === 'compact' ? 'py-2' : 'py-3'} text-[#475569] font-medium`}>
                        {l.source}
                      </td>
                      <td className={`px-3 ${viewDensity === 'compact' ? 'py-2' : 'py-3'} text-[#64748b]`}>
                        {l.next_follow_up || '—'}
                      </td>
                      <td className={`px-4 text-right font-bold text-[#0f172a] ${viewDensity === 'compact' ? 'py-2' : 'py-3'}`}>
                        {l.won_value ? `₹${l.won_value.toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  );
                })
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
