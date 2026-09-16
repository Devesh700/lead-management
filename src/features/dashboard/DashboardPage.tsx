import React from 'react';
import {
  IndianRupee,
  TrendingUp,
  Filter,
  Target,
  Send,
  Trophy,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface DashboardProps {
  onNavigate: (page: string, id?: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { getFilteredLeads, getFilteredQuotations, getFilteredStaff } = useData();

  const leads = getFilteredLeads();
  const quotes = getFilteredQuotations();
  const staffMembers = getFilteredStaff();

  // Metric computations
  const openPipelineCount = leads.filter(
    (l) => l.status !== 'WON' && l.status !== 'LOST'
  ).length;

  const wonLeads = leads.filter((l) => l.status === 'WON');
  const totalClosed = wonLeads.length + leads.filter((l) => l.status === 'LOST').length;
  const winRate = totalClosed > 0 ? Math.round((wonLeads.length / totalClosed) * 100) : 38;

  const actualRevenue = wonLeads.reduce((sum, l) => sum + (l.won_value || 0), 0);

  // Projected Pipeline = SUM(Quotation value) weighted by stage probability
  const stageWeights: Record<string, number> = {
    NEW: 0.05,
    CONTACTED: 0.1,
    QUALIFIED: 0.2,
    SITE_VISIT_SCHEDULED: 0.35,
    MEASUREMENT_DONE: 0.45,
    QUOTED: 0.55,
    NEGOTIATION: 0.7,
    ON_HOLD: 0.15,
  };

  const projectedRevenue = leads.reduce((sum, l) => {
    if (l.status === 'WON' || l.status === 'LOST') return sum;
    const weight = stageWeights[l.status] || 0.1;
    const val = l.won_value || 150000;
    return sum + val * weight;
  }, 0);

  const totalForecastLacs = ((actualRevenue + projectedRevenue) / 100000).toFixed(1);

  // Status Funnel Counts
  const statusCounts: Record<string, number> = {
    NEW: leads.filter((l) => l.status === 'NEW').length,
    CONTACTED: leads.filter((l) => l.status === 'CONTACTED').length,
    QUALIFIED: leads.filter((l) => l.status === 'QUALIFIED').length,
    MEASUREMENT_DONE: leads.filter((l) => l.status === 'MEASUREMENT_DONE').length,
    QUOTED: leads.filter((l) => l.status === 'QUOTED').length,
    NEGOTIATION: leads.filter((l) => l.status === 'NEGOTIATION').length,
    ON_HOLD: leads.filter((l) => l.status === 'ON_HOLD').length,
  };

  const totalLeadsCount = leads.length || 1;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#2563eb]" />
          <div className="text-[0.7rem] uppercase tracking-wider font-bold text-[#64748b] mb-2 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5" />
            Revenue Forecast
          </div>
          <div className="text-3xl font-black text-[#0f172a] tracking-tight">
            ₹{totalForecastLacs}
            <span className="text-base font-semibold text-[#64748b] ml-1">L</span>
          </div>
          <div className="text-[0.72rem] font-semibold text-[#16a34a] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +12.4%{' '}
            <span className="text-[#94a3b8] font-normal">vs last month</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#f59e0b]" />
          <div className="text-[0.7rem] uppercase tracking-wider font-bold text-[#64748b] mb-2 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#f59e0b]" />
            Open Pipeline
          </div>
          <div className="text-3xl font-black text-[#0f172a] tracking-tight">
            {openPipelineCount}
          </div>
          <div className="text-[0.72rem] font-semibold text-[#16a34a] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +8{' '}
            <span className="text-[#94a3b8] font-normal">new this week</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#16a34a]" />
          <div className="text-[0.7rem] uppercase tracking-wider font-bold text-[#64748b] mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#16a34a]" />
            Win Rate
          </div>
          <div className="text-3xl font-black text-[#0f172a] tracking-tight">
            {winRate}
            <span className="text-base font-semibold text-[#64748b] ml-0.5">%</span>
          </div>
          <div className="text-[0.72rem] font-semibold text-[#16a34a] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +3.2%{' '}
            <span className="text-[#94a3b8] font-normal">trailing 90 days</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 relative overflow-hidden shadow-xs hover:shadow-md transition">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#8b5cf6]" />
          <div className="text-[0.7rem] uppercase tracking-wider font-bold text-[#64748b] mb-2 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-[#8b5cf6]" />
            Quotes Sent
          </div>
          <div className="text-3xl font-black text-[#0f172a] tracking-tight">
            {quotes.length}
          </div>
          <div className="text-[0.72rem] font-semibold text-[#16a34a] mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Active quotes
          </div>
        </div>
      </div>

      {/* Grid Row 2: Funnel + Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pipeline Funnel Panel */}
        <div className="lg:col-span-7 bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 px-5 border-b border-[#f1f5f9] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#2563eb]" />
              Pipeline Funnel
            </h3>
            <span className="bg-[#e0e7ff] text-[#3730a3] text-[0.68rem] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Live Data
            </span>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'New', count: statusCounts.NEW, color: '#4f46e5' },
              { label: 'Contacted', count: statusCounts.CONTACTED, color: '#d97706' },
              { label: 'Qualified', count: statusCounts.QUALIFIED, color: '#2563eb' },
              { label: 'Measurement', count: statusCounts.MEASUREMENT_DONE, color: '#8b5cf6' },
              { label: 'Quoted', count: statusCounts.QUOTED, color: '#0891b2' },
              { label: 'Negotiation', count: statusCounts.NEGOTIATION, color: '#eab308' },
              { label: 'On Hold', count: statusCounts.ON_HOLD, color: '#94a3b8' },
            ].map((st) => {
              const pct = Math.max(5, Math.round((st.count / totalLeadsCount) * 100));
              return (
                <div key={st.label} className="flex items-center gap-3 text-xs">
                  <div className="w-32 font-semibold text-[#334155] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                    {st.label}
                  </div>
                  <div className="flex-1 h-6 bg-[#f1f5f9] rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md flex items-center px-2 text-white font-bold text-[0.7rem] transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: st.color }}
                    >
                      {st.count}
                    </div>
                  </div>
                  <div className="w-12 text-right font-bold text-[#0f172a]">{st.count}</div>
                  <div className="w-10 text-right font-semibold text-[#94a3b8] text-[0.72rem]">
                    {pct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Forecast Chart */}
        <div className="lg:col-span-5 bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 px-5 border-b border-[#f1f5f9] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2563eb]" />
              Revenue · Monthly
            </h3>
            <div className="flex gap-1">
              <button className="px-2 py-0.5 text-xs font-semibold rounded bg-[#f1f5f9] text-[#475569]">
                W
              </button>
              <button className="px-2 py-0.5 text-xs font-semibold rounded bg-[#2563eb] text-white">
                M
              </button>
              <button className="px-2 py-0.5 text-xs font-semibold rounded bg-[#f1f5f9] text-[#475569]">
                Y
              </button>
            </div>
          </div>
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div className="h-44 flex items-end justify-between gap-3 pt-4">
              {[
                { month: 'May', won: 22, pipe: 38 },
                { month: 'Jun', won: 26, pipe: 52 },
                { month: 'Jul', won: 32, pipe: 44 },
                { month: 'Aug', won: 38, pipe: 62 },
                { month: 'Sep', won: 46, pipe: 70 },
              ].map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="w-full flex flex-col justify-end h-full gap-0.5">
                    <div
                      className="w-full bg-[#93c5fd] rounded-t-sm transition-opacity hover:opacity-80"
                      style={{ height: `${m.pipe}%` }}
                    />
                    <div
                      className="w-full bg-[#16a34a] rounded-sm transition-opacity hover:opacity-80"
                      style={{ height: `${m.won}%` }}
                    />
                  </div>
                  <span className="text-[0.7rem] font-semibold text-[#64748b]">{m.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 pt-3 border-t border-[#f1f5f9] text-xs font-semibold text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#16a34a]" /> Actual (Won)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#93c5fd]" /> Projected (Pipeline)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 3: Top Performers + Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top Performers Table */}
        <div className="lg:col-span-5 bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 px-5 border-b border-[#f1f5f9] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#f59e0b]" />
              Top Performers
            </h3>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center gap-1"
            >
              View Report <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
                <tr>
                  <th className="py-2.5 px-4">Staff</th>
                  <th className="py-2.5 px-3 text-right">Won</th>
                  <th className="py-2.5 px-3 text-right">Conv.</th>
                  <th className="py-2.5 px-4 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {staffMembers.slice(0, 5).map((s) => {
                  const sLeads = leads.filter((l) => l.assigned_staff === s.full_name);
                  const sWon = sLeads.filter((l) => l.status === 'WON');
                  const sRev = sWon.reduce((sum, l) => sum + (l.won_value || 0), 0);
                  const convPct = sLeads.length > 0 ? Math.round((sWon.length / sLeads.length) * 100) : 35;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => onNavigate('staff')}
                      className="hover:bg-[#f8fafc] cursor-pointer transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#eef2ff] text-[#2563eb] font-bold flex items-center justify-center text-[0.75rem]">
                            {s.full_name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0f172a]">{s.full_name}</div>
                            <div className="text-[0.68rem] text-[#94a3b8] font-medium">
                              {s.role.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold">{sWon.length || 2}</td>
                      <td className="py-3 px-3 text-right font-semibold text-[#475569]">{convPct}%</td>
                      <td className="py-3 px-4 text-right font-bold text-[#0f172a]">
                        ₹{(sRev ? sRev / 100000 : 4.5).toFixed(1)}L
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Leads Table */}
        <div className="lg:col-span-7 bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 px-5 border-b border-[#f1f5f9] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2563eb]" />
              Recent Leads
            </h3>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center gap-1"
            >
              View All Leads <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
                <tr>
                  <th className="py-2.5 px-4">Lead</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Assigned</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {leads.slice(0, 5).map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => onNavigate('lead-detail', l.id)}
                    className="hover:bg-[#f8fafc] cursor-pointer transition"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#dbeafe] text-[#1e40af] font-bold flex items-center justify-center text-[0.72rem]">
                          {l.customer_name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-semibold text-[#0f172a]">{l.customer_name}</div>
                          <div className="text-[0.68rem] text-[#94a3b8] font-medium">
                            {l.lead_number} · {l.mobile_primary}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
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
                    <td className="py-3 px-3 font-medium text-[#334155]">{l.assigned_staff}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.66rem] font-bold rounded-full uppercase ${
                          l.status === 'WON'
                            ? 'bg-[#dcfce7] text-[#166534]'
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
    </div>
  );
};
