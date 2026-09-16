import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface QuotationsListProps {
  onNavigate: (page: string, id?: string) => void;
}

export const QuotationsListPage: React.FC<QuotationsListProps> = ({ onNavigate }) => {
  const { getFilteredQuotations, activeCategory } = useData();

  const quotations = getFilteredQuotations();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const filteredQuotes = quotations.filter((q) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNo = q.quote_number.toLowerCase().includes(term);
      const matchCust = q.customer_name.toLowerCase().includes(term);
      if (!matchNo && !matchCust) return false;
    }
    if (selectedStatus !== 'ALL' && q.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Result Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-[#64748b]">
          Showing <strong className="text-[#0f172a]">{filteredQuotes.length} quotations</strong> in{' '}
          <strong className="text-[#0f172a]">
            {activeCategory === 'ALL' ? 'All Categories' : activeCategory}
          </strong>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('quotation-builder')}
            className="px-3.5 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-4 h-4" /> New Quotation
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by quote number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-medium outline-none focus:border-[#2563eb]"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0f172a] outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SHARED">Shared</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVISED">Revised</option>
        </select>
      </div>

      {/* Quotations Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
              <tr>
                <th className="py-3 px-4">Quote ID</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Created By</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#94a3b8]">
                    No quotations found.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr
                    key={q.id}
                    onClick={() => onNavigate('quotation-detail', q.id)}
                    className="hover:bg-[#f8fafc] cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-bold text-[#0f172a]">{q.quote_number}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#0f172a]">{q.customer_name}</div>
                      <div className="text-[0.68rem] text-[#94a3b8]">{q.lead_number}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex px-2 py-0.5 text-[0.66rem] font-bold rounded ${
                          q.category_code === 'SG'
                            ? 'bg-[#dbeafe] text-[#1e40af]'
                            : q.category_code === 'KIT'
                            ? 'bg-[#fef3c7] text-[#92400e]'
                            : 'bg-[#dcfce7] text-[#166534]'
                        }`}
                      >
                        {q.category_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex px-2.5 py-0.5 text-[0.66rem] font-bold rounded-full uppercase ${
                          q.status === 'ACCEPTED'
                            ? 'bg-[#dcfce7] text-[#166534]'
                            : q.status === 'SHARED'
                            ? 'bg-[#dbeafe] text-[#1e40af]'
                            : q.status === 'REJECTED'
                            ? 'bg-[#fee2e2] text-[#991b1b]'
                            : q.status === 'REVISED'
                            ? 'bg-[#f3e8ff] text-[#6b21a8]'
                            : 'bg-[#f1f5f9] text-[#475569]'
                        }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#334155] font-medium">{q.created_by}</td>
                    <td className="py-3.5 px-3 text-[#64748b]">{q.quote_date}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#0f172a]">
                      ₹{q.total_amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
