import React from 'react';
import { ArrowLeft, Share2, User, Calendar, Clock } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface QuotationDetailProps {
  quoteId: string;
  onNavigate: (page: string, id?: string) => void;
}

export const QuotationDetailPage: React.FC<QuotationDetailProps> = ({
  quoteId,
  onNavigate,
}) => {
  const { quotations, updateQuotationStatus } = useData();

  const quotation = quotations.find((q) => q.id === quoteId) || quotations[0];

  if (!quotation) {
    return (
      <div className="p-8 text-center text-[#64748b]">
        Quotation not found.{' '}
        <button onClick={() => onNavigate('quotations')} className="text-[#2563eb] underline">
          Back to quotations
        </button>
      </div>
    );
  }

  const subtotal = quotation.line_items?.reduce((sum, item) => sum + item.line_total, 0) || quotation.total_amount;
  const tokenAmt = quotation.token_amount || 0;
  const dueAmt = quotation.due_amount ?? Math.max(0, subtotal - tokenAmt);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('quotations')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </button>
        <div className="flex items-center gap-2">
          {quotation.status === 'DRAFT' && (
            <button
              onClick={() => updateQuotationStatus(quotation.id, 'SHARED')}
              className="px-3.5 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Mark as Shared
            </button>
          )}
          {quotation.status === 'SHARED' && (
            <button
              onClick={() => updateQuotationStatus(quotation.id, 'ACCEPTED')}
              className="px-3.5 py-1.5 rounded-lg bg-[#16a34a] text-white text-xs font-semibold hover:bg-[#15803d] flex items-center gap-1.5"
            >
              Mark as Accepted
            </button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-[#0f172a] tracking-tight">
                {quotation.quote_number}
              </h2>
              <span
                className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${
                  quotation.status === 'ACCEPTED'
                    ? 'bg-[#dcfce7] text-[#166534]'
                    : quotation.status === 'SHARED'
                    ? 'bg-[#dbeafe] text-[#1e40af]'
                    : 'bg-[#f1f5f9] text-[#475569]'
                }`}
              >
                {quotation.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-xs text-[#475569]">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#94a3b8]" /> Customer: <strong>{quotation.customer_name}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" /> Date: {quotation.quote_date}
              </span>
              {quotation.valid_until && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#94a3b8]" /> Valid until: {quotation.valid_until}
                </span>
              )}
              <span
                className={`inline-flex px-2 py-0.5 text-[0.66rem] font-bold rounded ${
                  quotation.category_code === 'SG'
                    ? 'bg-[#dbeafe] text-[#1e40af]'
                    : quotation.category_code === 'KIT'
                    ? 'bg-[#fef3c7] text-[#92400e]'
                    : 'bg-[#dcfce7] text-[#166534]'
                }`}
              >
                {quotation.category_code}
              </span>
              <span className="text-[#64748b]">Created by: {quotation.created_by}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#0f172a] border-b border-[#f1f5f9] pb-3">
          Line Items Summary
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
              <tr>
                <th className="py-2.5 px-4 min-w-[180px]">Product Name</th>
                <th className="py-2.5 px-3">Code / Model</th>
                <th className="py-2.5 px-3 min-w-[150px]">Description</th>
                <th className="py-2.5 px-3 text-right">MRP</th>
                <th className="py-2.5 px-3 text-right">Offer Price</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {(!quotation.line_items || quotation.line_items.length === 0) ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#94a3b8]">
                    No detailed line items entered. Total quote value: ₹{quotation.total_amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ) : (
                quotation.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 px-4 font-semibold text-[#0f172a]">{item.product_name}</td>
                    <td className="py-3 px-3 text-[#64748b]">{item.product_code || '—'}</td>
                    <td className="py-3 px-3 text-[#475569]">{item.description || '—'}</td>
                    <td className="py-3 px-3 text-right text-[#94a3b8]">
                      {item.mrp ? `₹${item.mrp.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-[#334155]">
                      ₹{item.offer_price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-[#0f172a]">
                      ₹{item.line_total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="border-t-2 border-[#e2e8f0] text-xs">
              <tr>
                <td colSpan={6} className="py-2 px-4 text-right text-[#64748b] font-medium">
                  Subtotal:
                </td>
                <td className="py-2 px-4 text-right font-bold text-[#0f172a]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="py-2 px-4 text-right text-[#64748b] font-medium">
                  Token / Advance Paid:
                </td>
                <td className="py-2 px-4 text-right font-bold text-[#16a34a]">
                  ₹{tokenAmt.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="text-sm font-extrabold text-[#2563eb]">
                <td colSpan={6} className="py-3 px-4 text-right">
                  Due Amount:
                </td>
                <td className="py-3 px-4 text-right">
                  ₹{dueAmt.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
