import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  Tag,
  User,
  Flame,
  Plus,
  ArrowLeft,
  FileText,
  Clock,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { LeadStatus } from '../../types';

interface LeadDetailProps {
  leadId: string;
  onNavigate: (page: string, id?: string) => void;
}

export const LeadDetailPage: React.FC<LeadDetailProps> = ({ leadId, onNavigate }) => {
  const { leads, updateLeadStatus, addLeadActivity, quotations, currentStaff } = useData();

  const lead = leads.find((l) => l.id === leadId) || leads[0];

  const [newRemark, setNewRemark] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>(lead ? lead.status : 'NEW');
  const [statusNote, setStatusNote] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [wonAmount, setWonAmount] = useState<number>(lead?.won_value || 0);

  if (!lead) {
    return (
      <div className="p-8 text-center text-[#64748b]">
        Lead not found.{' '}
        <button onClick={() => onNavigate('leads')} className="text-[#2563eb] underline">
          Back to leads
        </button>
      </div>
    );
  }

  // Linked quotes for this lead
  const linkedQuotes = quotations.filter((q) => q.lead_id === lead.id);

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    addLeadActivity(lead.id, {
      lead_id: lead.id,
      type: 'REMARK',
      note: newRemark,
      created_by_staff: currentStaff.full_name,
    });

    setNewRemark('');
  };

  const handleSaveStatusChange = (e: React.FormEvent) => {
    e.preventDefault();
    updateLeadStatus(
      lead.id,
      selectedStatus,
      statusNote || `Status updated to ${selectedStatus}`,
      selectedStatus === 'LOST' ? lostReason : undefined,
      selectedStatus === 'WON' ? Number(wonAmount) : undefined
    );
    setShowStatusModal(false);
    setStatusNote('');
  };

  return (
    <div className="space-y-5">
      {/* Top Navigation & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('leads')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
      </div>

      {/* Detail Header Banner */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">
                {lead.customer_name}
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                  lead.status === 'WON'
                    ? 'bg-[#dcfce7] text-[#166534]'
                    : lead.status === 'LOST'
                    ? 'bg-[#fee2e2] text-[#991b1b]'
                    : lead.status === 'QUOTED'
                    ? 'bg-[#cffafe] text-[#155e75]'
                    : 'bg-[#e0e7ff] text-[#3730a3]'
                }`}
              >
                {lead.status}
              </span>
              {lead.hot_lead && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#d97706] bg-[#fef3c7] px-2.5 py-0.5 rounded-full">
                  <Flame className="w-3.5 h-3.5" /> Hot Lead
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-[#475569]">
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-[#64748b]">ID:</span> {lead.lead_number}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#94a3b8]" /> {lead.mobile_primary}
                {lead.mobile_secondary && ` / ${lead.mobile_secondary}`}
              </span>
              {lead.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#94a3b8]" /> {lead.address}
                </span>
              )}
              <span
                className={`inline-flex px-2 py-0.5 text-[0.66rem] font-bold rounded ${
                  lead.category_code === 'SG'
                    ? 'bg-[#dbeafe] text-[#1e40af]'
                    : lead.category_code === 'KIT'
                    ? 'bg-[#fef3c7] text-[#92400e]'
                    : 'bg-[#dcfce7] text-[#166534]'
                }`}
              >
                {lead.category}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#94a3b8]" /> Assigned: <strong>{lead.assigned_staff}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#94a3b8]" /> Source: {lead.source}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedStatus(lead.status);
                setShowStatusModal(true);
              }}
              className="px-3.5 py-2 rounded-xl border border-[#e2e8f0] bg-white text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] flex items-center gap-1.5 transition"
            >
              Update Status
            </button>
            <button
              onClick={() => onNavigate('quotation-builder', lead.id)}
              className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-4 h-4" /> New Quotation
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Activity Timeline + Details/Linked Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Activity Timeline Column */}
        <div className="lg:col-span-7 bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563eb]" /> Activity Timeline
            </h3>
            <span className="text-[0.66rem] font-bold text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded">
              Append-only
            </span>
          </div>

          {/* Add Remark Form */}
          <form onSubmit={handleAddRemark} className="space-y-2">
            <textarea
              rows={2}
              placeholder="Add a remark, follow-up note, or call log..."
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              className="w-full p-3 border border-[#e2e8f0] rounded-xl text-xs font-medium outline-none focus:border-[#2563eb]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#2563eb] text-white text-xs font-semibold rounded-lg hover:bg-[#1d4ed8] transition"
              >
                Save Entry
              </button>
            </div>
          </form>

          {/* Timeline Feed */}
          <div className="relative pl-5 space-y-4 border-l-2 border-[#e8edf3]">
            {(!lead.activities || lead.activities.length === 0) ? (
              <p className="text-xs text-[#94a3b8] py-2">No timeline activity logged yet.</p>
            ) : (
              lead.activities.map((act) => (
                <div key={act.id} className="relative text-xs">
                  <span
                    className={`absolute -left-[27px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      act.type === 'STATUS_CHANGE'
                        ? 'bg-[#f59e0b]'
                        : act.type === 'CALL_LOG'
                        ? 'bg-[#8b5cf6]'
                        : 'bg-[#2563eb]'
                    }`}
                  />
                  <div className="text-[0.66rem] font-bold text-[#94a3b8] uppercase tracking-wider">
                    {act.created_at}
                  </div>
                  <div className="text-[#1e293b] font-medium mt-0.5">{act.note}</div>
                  <div className="text-[0.68rem] text-[#64748b] font-medium mt-0.5">
                    by {act.created_by_staff}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Details & Linked Quotations Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Details Card */}
          <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#0f172a] border-b border-[#f1f5f9] pb-3">
              Lead Requirements
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#f8fafc]">
                <span className="text-[#64748b] font-medium">Requirement</span>
                <span className="font-semibold text-[#0f172a] text-right">
                  {lead.requirement_description || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f8fafc]">
                <span className="text-[#64748b] font-medium">Target Month</span>
                <span className="font-semibold text-[#0f172a]">{lead.requirement_month || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f8fafc]">
                <span className="text-[#64748b] font-medium">Referred By</span>
                <span className="font-semibold text-[#0f172a]">{lead.referred_by || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#f8fafc]">
                <span className="text-[#64748b] font-medium">Next Follow-up</span>
                <span className="font-semibold text-[#0f172a]">{lead.next_follow_up || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#64748b] font-medium">Created Date</span>
                <span className="font-semibold text-[#0f172a]">{lead.created_at}</span>
              </div>
            </div>
          </div>

          {/* Linked Quotations Panel */}
          <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563eb]" /> Linked Quotations
              </h3>
              <button
                onClick={() => onNavigate('quotation-builder', lead.id)}
                className="p-1 rounded bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {linkedQuotes.length === 0 ? (
              <p className="text-xs text-[#94a3b8] py-2">No quotations generated for this lead yet.</p>
            ) : (
              <div className="divide-y divide-[#f1f5f9]">
                {linkedQuotes.map((q) => (
                  <div
                    key={q.id}
                    onClick={() => onNavigate('quotation-detail', q.id)}
                    className="py-2.5 flex items-center justify-between hover:bg-[#f8fafc] px-2 rounded-lg cursor-pointer transition text-xs"
                  >
                    <div>
                      <div className="font-bold text-[#0f172a]">{q.quote_number}</div>
                      <div className="text-[0.68rem] text-[#64748b]">
                        {q.quote_date} · ₹{q.total_amount.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-[0.66rem] font-bold rounded-full uppercase ${
                        q.status === 'ACCEPTED'
                          ? 'bg-[#dcfce7] text-[#166534]'
                          : q.status === 'SHARED'
                          ? 'bg-[#dbeafe] text-[#1e40af]'
                          : 'bg-[#f1f5f9] text-[#475569]'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl border border-[#e2e8f0]">
            <h3 className="text-sm font-bold text-[#0f172a] border-b border-[#f1f5f9] pb-3">
              Update Lead Pipeline Status
            </h3>

            <form onSubmit={handleSaveStatusChange} className="space-y-3 text-xs">
              <div>
                <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                  Target Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as LeadStatus)}
                  className="w-full p-2 border border-[#e2e8f0] rounded-lg font-semibold text-[#0f172a]"
                >
                  {[
                    'NEW',
                    'CONTACTED',
                    'QUALIFIED',
                    'SITE_VISIT_SCHEDULED',
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
              </div>

              {selectedStatus === 'LOST' && (
                <div>
                  <label className="block text-[0.7rem] font-bold text-[#dc2626] mb-1">
                    Lost Reason <span className="text-[#dc2626]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Price too high, competitor selected"
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none"
                  />
                </div>
              )}

              {selectedStatus === 'WON' && (
                <div>
                  <label className="block text-[0.7rem] font-bold text-[#16a34a] mb-1">
                    Final Won Deal Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={wonAmount}
                    onChange={(e) => setWonAmount(Number(e.target.value))}
                    className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                  Remarks / Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional remark for timeline entry..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#475569]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-white font-semibold"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
