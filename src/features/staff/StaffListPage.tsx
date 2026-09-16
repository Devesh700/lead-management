import React from 'react';
import { useData } from '../../context/DataContext';

interface StaffListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const StaffListPage: React.FC<StaffListProps> = ({ onNavigate }) => {
  const { getFilteredStaff, leads, activeCategory } = useData();

  const staffMembers = getFilteredStaff();

  return (
    <div className="space-y-4">
      {/* Result Bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-[#64748b]">
          Showing <strong className="text-[#0f172a]">{staffMembers.length} staff members</strong> in{' '}
          <strong className="text-[#0f172a]">
            {activeCategory === 'ALL' ? 'All Categories' : activeCategory}
          </strong>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Categories</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-right">Active Leads</th>
                <th className="py-3 px-3 text-right">Won</th>
                <th className="py-3 px-4 text-right">Conv %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {staffMembers.map((s) => {
                const sLeads = leads.filter(
                  (l) => l.assigned_staff === s.full_name || l.assigned_staff_id === s.id
                );
                const sWon = sLeads.filter((l) => l.status === 'WON');
                const convPct = sLeads.length > 0 ? Math.round((sWon.length / sLeads.length) * 100) : 35;

                return (
                  <tr
                    key={s.id}
                    onClick={() => onNavigate('staff-detail', s.id)}
                    className="hover:bg-[#f8fafc] cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#eef2ff] text-[#2563eb] font-bold flex items-center justify-center text-[0.78rem]">
                          {s.full_name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0f172a]">{s.full_name}</div>
                          <div className="text-[0.68rem] text-[#94a3b8]">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[0.66rem] font-bold rounded-full uppercase ${
                          s.role === 'SUPER_ADMIN'
                            ? 'bg-[#f3e8ff] text-[#6b21a8]'
                            : s.role === 'CATEGORY_MANAGER'
                            ? 'bg-[#ede9fe] text-[#5b21b6]'
                            : 'bg-[#f1f5f9] text-[#475569]'
                        }`}
                      >
                        {s.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex gap-1 flex-wrap">
                        {s.categories.map((c) => (
                          <span
                            key={c}
                            className={`px-1.5 py-0.5 text-[0.62rem] font-bold rounded ${
                              c === 'SG'
                                ? 'bg-[#dbeafe] text-[#1e40af]'
                                : c === 'KIT'
                                ? 'bg-[#fef3c7] text-[#92400e]'
                                : 'bg-[#dcfce7] text-[#166534]'
                            }`}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-[#475569]">{s.phone}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#0f172a]">
                      {sLeads.length}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#16a34a]">
                      {sWon.length}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#334155]">
                      {convPct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
