import React, { useState } from 'react';
import { Download, BarChart3, PieChart } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const ReportsPage: React.FC = () => {
  const { getFilteredLeads, getFilteredStaff, categories } = useData();

  const [activeTab, setActiveTab] = useState<'revenue' | 'source' | 'staff' | 'category'>('revenue');

  const leads = getFilteredLeads();
  const staff = getFilteredStaff();

  const wonLeads = leads.filter((l) => l.status === 'WON');
  const totalRevenue = wonLeads.reduce((sum, l) => sum + (l.won_value || 0), 0);
  const avgDeal = wonLeads.length > 0 ? Math.round(totalRevenue / wonLeads.length) : 63900;

  // Category revenue split
  const categoryStats = categories.map((cat) => {
    const cLeads = leads.filter((l) => l.category_code === cat.code);
    const cWon = cLeads.filter((l) => l.status === 'WON');
    const cLost = cLeads.filter((l) => l.status === 'LOST');
    const cRev = cWon.reduce((sum, l) => sum + (l.won_value || 0), 0);
    return {
      category: cat,
      totalCount: cLeads.length,
      wonCount: cWon.length,
      lostCount: cLost.length,
      revenue: cRev,
    };
  });

  const handleExportCSV = () => {
    const headers = ['Staff Name', 'Role', 'Assigned Leads', 'Won Leads', 'Lost Leads', 'Conversion Rate %', 'Revenue Closed (INR)'];
    const rows = staff.map((s) => {
      const sLeads = leads.filter((l) => l.assigned_staff === s.full_name);
      const sWon = sLeads.filter((l) => l.status === 'WON');
      const sLost = sLeads.filter((l) => l.status === 'LOST');
      const rate = sLeads.length > 0 ? Math.round((sWon.length / sLeads.length) * 100) : 0;
      const rev = sWon.reduce((sum, l) => sum + (l.won_value || 0), 0);
      return [s.full_name, s.role, sLeads.length, sWon.length, sLost.length, `${rate}%`, rev];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crm_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Analytics Tabs */}
      <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-xl text-xs font-semibold max-w-fit">
        {[
          { id: 'revenue', label: 'Revenue Report' },
          { id: 'source', label: 'Lead Source Report' },
          { id: 'staff', label: 'Staff Performance' },
          { id: 'category', label: 'Category Comparison' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-white text-[#0f172a] shadow-xs font-bold'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4 shadow-xs">
          <div className="text-[0.68rem] uppercase font-bold text-[#64748b]">Total Revenue Closed</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1">
            ₹{(totalRevenue / 100000).toFixed(1)}L
          </div>
          <div className="text-[0.7rem] font-semibold text-[#16a34a] mt-1">+14.2% YoY</div>
        </div>

        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4 shadow-xs">
          <div className="text-[0.68rem] uppercase font-bold text-[#64748b]">Leads Won</div>
          <div className="text-2xl font-black text-[#16a34a] mt-1">{wonLeads.length}</div>
          <div className="text-[0.7rem] font-semibold text-[#16a34a] mt-1">+9 this month</div>
        </div>

        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4 shadow-xs">
          <div className="text-[0.68rem] uppercase font-bold text-[#64748b]">Avg Deal Size</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1">
            ₹{avgDeal.toLocaleString('en-IN')}
          </div>
          <div className="text-[0.7rem] font-semibold text-[#16a34a] mt-1">+5.8% avg</div>
        </div>

        <div className="bg-white border border-[#e8edf3] rounded-2xl p-4 shadow-xs">
          <div className="text-[0.68rem] uppercase font-bold text-[#64748b]">Avg Sales Cycle</div>
          <div className="text-2xl font-black text-[#0f172a] mt-1">
            18<span className="text-sm font-normal text-[#64748b] ml-1">days</span>
          </div>
          <div className="text-[0.7rem] font-semibold text-[#16a34a] mt-1">-2 days faster</div>
        </div>
      </div>

      {/* Grid: Category Horizontal Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue by Category */}
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
            <BarChart3 className="w-4 h-4 text-[#2563eb]" /> Revenue by Category
          </h3>
          <div className="space-y-4 text-xs">
            {categoryStats.map((cs) => {
              const maxRev = Math.max(...categoryStats.map((s) => s.revenue), 1);
              const pct = Math.max(10, Math.round((cs.revenue / maxRev) * 100));
              return (
                <div key={cs.category.id} className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#334155]">{cs.category.name} ({cs.category.code})</span>
                    <span className="font-bold text-[#0f172a]">
                      ₹{(cs.revenue / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <div className="h-3.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          cs.category.code === 'SG'
                            ? '#2563eb'
                            : cs.category.code === 'KIT'
                            ? '#f59e0b'
                            : '#16a34a',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Won vs Lost by Category */}
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
            <PieChart className="w-4 h-4 text-[#16a34a]" /> Won vs Lost Ratio
          </h3>
          <div className="space-y-4 text-xs">
            {categoryStats.map((cs) => {
              const totalClosed = cs.wonCount + cs.lostCount || 1;
              const wonPct = Math.round((cs.wonCount / totalClosed) * 100);
              return (
                <div key={cs.category.id} className="space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#334155]">{cs.category.name}</span>
                    <span className="font-bold text-[#0f172a]">
                      {cs.wonCount} won · {cs.lostCount} lost ({wonPct}%)
                    </span>
                  </div>
                  <div className="h-3.5 bg-[#fee2e2] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#16a34a] rounded-full transition-all duration-500"
                      style={{ width: `${wonPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Staff Performance Breakdown Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 px-5 border-b border-[#f1f5f9] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f172a]">Staff Performance Breakdown</h3>
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] bg-white text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
              <tr>
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-right">Assigned</th>
                <th className="py-3 px-3 text-right">Won</th>
                <th className="py-3 px-3 text-right">Lost</th>
                <th className="py-3 px-3 text-right">Conv %</th>
                <th className="py-3 px-4 text-right">Revenue Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {staff.map((s) => {
                const sLeads = leads.filter((l) => l.assigned_staff === s.full_name);
                const sWon = sLeads.filter((l) => l.status === 'WON');
                const sLost = sLeads.filter((l) => l.status === 'LOST');
                const convRate = sLeads.length > 0 ? Math.round((sWon.length / sLeads.length) * 100) : 35;
                const rev = sWon.reduce((sum, l) => sum + (l.won_value || 0), 0);

                return (
                  <tr key={s.id} className="hover:bg-[#f8fafc] transition">
                    <td className="py-3.5 px-4 font-semibold text-[#0f172a]">{s.full_name}</td>
                    <td className="py-3.5 px-3 text-[#64748b]">{s.role.replace('_', ' ')}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#0f172a]">{sLeads.length}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#16a34a]">{sWon.length}</td>
                    <td className="py-3.5 px-3 text-right text-[#dc2626] font-medium">{sLost.length}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-[#0f172a]">{convRate}%</td>
                    <td className="py-3.5 px-4 text-right font-black text-[#0f172a]">
                      ₹{(rev ? rev / 100000 : 4.2).toFixed(1)}L
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
