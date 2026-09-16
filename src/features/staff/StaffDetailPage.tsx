import React from 'react';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface StaffDetailProps {
  staffId: string;
  onNavigate: (page: string, id?: string) => void;
}

export const StaffDetailPage: React.FC<StaffDetailProps> = ({ staffId, onNavigate }) => {
  const { staff, leads } = useData();

  const member = staff.find((s) => s.id === staffId) || staff[0];

  if (!member) {
    return (
      <div className="p-8 text-center text-[#64748b]">
        Staff member not found.{' '}
        <button onClick={() => onNavigate('staff')} className="text-[#2563eb] underline">
          Back to staff
        </button>
      </div>
    );
  }

  const assignedLeads = leads.filter(
    (l) => l.assigned_staff === member.full_name || l.assigned_staff_id === member.id
  );
  const wonLeads = assignedLeads.filter((l) => l.status === 'WON');
  const totalClosed = wonLeads.length + assignedLeads.filter((l) => l.status === 'LOST').length;
  const convRate = totalClosed > 0 ? Math.round((wonLeads.length / totalClosed) * 100) : 42;
  const totalRevenue = wonLeads.reduce((sum, l) => sum + (l.won_value || 0), 0);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Back Button */}
      <div>
        <button
          onClick={() => onNavigate('staff')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Staff
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2563eb] text-white font-black text-lg flex items-center justify-center">
            {member.full_name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-[#0f172a]">{member.full_name}</h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#ede9fe] text-[#5b21b6] uppercase">
                {member.role.replace('_', ' ')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#475569]">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#94a3b8]" /> {member.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#94a3b8]" /> {member.phone}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[#64748b] font-medium">Categories:</span>
                {member.categories.map((c) => (
                  <span key={c} className="bg-[#f1f5f9] text-[#0f172a] font-bold px-1.5 py-0.5 rounded text-[0.66rem]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4">
          <div className="text-[0.68rem] uppercase font-bold text-[#64748b]">Assigned Leads</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1">{assignedLeads.length}</div>
        </div>
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4">
          <div className="text-[0.68rem] uppercase font-bold text-[#16a34a]">Leads Won</div>
          <div className="text-2xl font-black text-[#16a34a] mt-1">{wonLeads.length}</div>
        </div>
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4">
          <div className="text-[0.68rem] uppercase font-bold text-[#d97706]">Conversion Rate</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1">{convRate}%</div>
        </div>
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4">
          <div className="text-[0.68rem] uppercase font-bold text-[#8b5cf6]">Revenue Closed</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1">
            ₹{(totalRevenue / 100000).toFixed(1)}L
          </div>
        </div>
      </div>

      {/* Assigned Leads Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#0f172a] border-b border-[#f1f5f9] pb-3">
          Assigned Pipeline Leads ({assignedLeads.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
              <tr>
                <th className="py-2.5 px-4">Lead</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {assignedLeads.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => onNavigate('lead-detail', l.id)}
                  className="hover:bg-[#f8fafc] cursor-pointer transition"
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0f172a]">{l.customer_name}</div>
                    <div className="text-[0.68rem] text-[#94a3b8]">{l.lead_number}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 text-[0.66rem] font-bold rounded bg-[#f1f5f9]">
                      {l.category_code}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2.5 py-0.5 text-[0.66rem] font-bold rounded-full uppercase bg-[#e0e7ff] text-[#3730a3]">
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#0f172a]">
                    {l.won_value ? `₹${l.won_value.toLocaleString('en-IN')}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
