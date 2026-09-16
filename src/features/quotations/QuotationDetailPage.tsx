import React, { useState } from 'react';
import { ArrowLeft, Share2, User, Calendar, Clock, Edit3, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { QuotationLineItem, QuotationStatus } from '../../types';

interface QuotationDetailProps {
  quoteId: string;
  onNavigate: (page: string, id?: string) => void;
}

export const QuotationDetailPage: React.FC<QuotationDetailProps> = ({
  quoteId,
  onNavigate,
}) => {
  const { quotations, updateQuotation, updateQuotationStatus, addLeadActivity, currentStaff } = useData();

  const quotation = quotations.find((q) => q.id === quoteId) || quotations[0];

  const [isEditing, setIsEditing] = useState(false);
  const [editHeader, setEditHeader] = useState({
    customer_name: quotation?.customer_name || '',
    status: quotation?.status || 'DRAFT',
    valid_until: quotation?.valid_until || '',
    token_amount: quotation?.token_amount || 0,
  });

  const [editItems, setEditItems] = useState<QuotationLineItem[]>(quotation?.line_items || []);

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

  const handleStartEdit = () => {
    setEditHeader({
      customer_name: quotation.customer_name || '',
      status: quotation.status || 'DRAFT',
      valid_until: quotation.valid_until || '',
      token_amount: quotation.token_amount || 0,
    });
    setEditItems(
      (quotation.line_items && quotation.line_items.length > 0)
        ? JSON.parse(JSON.stringify(quotation.line_items))
        : [
            {
              id: `item-1`,
              product_name: '',
              product_code: '',
              description: '',
              mrp: 0,
              offer_price: 0,
              quantity: 1,
              line_total: 0,
            },
          ]
    );
    setIsEditing(true);
  };

  const handleAddItem = () => {
    setEditItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        product_name: '',
        product_code: '',
        description: '',
        mrp: 0,
        offer_price: 0,
        quantity: 1,
        line_total: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    setEditItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'offer_price' || field === 'quantity') {
          const price = field === 'offer_price' ? Number(value) : item.offer_price;
          const qty = field === 'quantity' ? Number(value) : item.quantity;
          updated.line_total = (price || 0) * (qty || 0);
        }
        return updated;
      })
    );
  };

  // Calculations for edit mode
  const currentSubtotal = isEditing
    ? editItems.reduce((sum, item) => sum + (Number(item.offer_price || 0) * Number(item.quantity || 0)), 0)
    : (quotation.line_items?.reduce((sum, item) => sum + item.line_total, 0) || quotation.total_amount);

  const currentToken = isEditing ? Number(editHeader.token_amount || 0) : (quotation.token_amount || 0);
  const currentDue = isEditing
    ? Math.max(0, currentSubtotal - currentToken)
    : (quotation.due_amount ?? Math.max(0, currentSubtotal - currentToken));

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedItems: QuotationLineItem[] = editItems.map((item) => ({
      ...item,
      offer_price: Number(item.offer_price || 0),
      quantity: Number(item.quantity || 1),
      line_total: Number(item.offer_price || 0) * Number(item.quantity || 1),
      mrp: item.mrp ? Number(item.mrp) : undefined,
    }));

    const calculatedTotal = formattedItems.reduce((acc, item) => acc + item.line_total, 0);
    const token = Number(editHeader.token_amount || 0);
    const due = Math.max(0, calculatedTotal - token);

    // Compute diffs
    const changes: string[] = [];

    if (quotation.customer_name !== editHeader.customer_name) {
      changes.push(`Customer Name ("${quotation.customer_name}" → "${editHeader.customer_name}")`);
    }
    if (quotation.status !== editHeader.status) {
      changes.push(`Status ("${quotation.status}" → "${editHeader.status}")`);
    }
    if ((quotation.valid_until || '') !== editHeader.valid_until) {
      changes.push(`Valid Until ("${quotation.valid_until || ''}" → "${editHeader.valid_until}")`);
    }
    if ((quotation.token_amount || 0) !== token) {
      changes.push(`Token Amount (₹${quotation.token_amount || 0} → ₹${token})`);
    }
    if (quotation.total_amount !== calculatedTotal) {
      changes.push(`Total Value (₹${quotation.total_amount.toLocaleString('en-IN')} → ₹${calculatedTotal.toLocaleString('en-IN')})`);
    }
    if ((quotation.line_items?.length || 0) !== formattedItems.length) {
      changes.push(`Line Items Count (${quotation.line_items?.length || 0} → ${formattedItems.length})`);
    }

    // Save quotation updates
    updateQuotation(quotation.id, {
      customer_name: editHeader.customer_name,
      status: editHeader.status as QuotationStatus,
      valid_until: editHeader.valid_until,
      token_amount: token,
      total_amount: calculatedTotal,
      due_amount: due,
      line_items: formattedItems,
    });

    // Log to linked lead's timeline if changes were made
    if (changes.length > 0 && quotation.lead_id) {
      const diffNote = `Updated Quotation ${quotation.quote_number}: ${changes.join(', ')}`;
      addLeadActivity(quotation.lead_id, {
        lead_id: quotation.lead_id,
        type: 'REMARK',
        note: diffNote,
        created_by_staff: currentStaff.full_name,
      });
    }

    setIsEditing(false);
  };

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
          {!isEditing ? (
            <>
              <button
                onClick={handleStartEdit}
                className="px-3.5 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs font-bold text-[#0f172a] hover:bg-[#f8fafc] flex items-center gap-1.5 shadow-2xs transition"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Details
              </button>
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
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs font-semibold text-[#475569] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDetails}
                className="px-4 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8]"
              >
                Save Details & Log Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-6 shadow-xs space-y-4">
        {isEditing ? (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#0f172a] border-b border-[#f1f5f9] pb-2">
              Edit Quotation Details ({quotation.quote_number})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={editHeader.customer_name}
                  onChange={(e) => setEditHeader({ ...editHeader, customer_name: e.target.value })}
                  className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                  Quotation Status
                </label>
                <select
                  value={editHeader.status}
                  onChange={(e) => setEditHeader({ ...editHeader, status: e.target.value as QuotationStatus })}
                  className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                >
                  {['DRAFT', 'SHARED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'REVISED'].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                  Valid Until Date
                </label>
                <input
                  type="date"
                  value={editHeader.valid_until}
                  onChange={(e) => setEditHeader({ ...editHeader, valid_until: e.target.value })}
                  className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                  Token / Advance Amount (₹)
                </label>
                <input
                  type="number"
                  value={editHeader.token_amount}
                  onChange={(e) => setEditHeader({ ...editHeader, token_amount: Number(e.target.value) })}
                  className="w-full p-2 border border-[#e2e8f0] rounded-lg outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Line Items Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <h3 className="text-sm font-bold text-[#0f172a]">
            Line Items Summary
          </h3>
          {isEditing && (
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3 py-1 bg-[#2563eb] text-white text-xs font-semibold rounded-lg hover:bg-[#1d4ed8] flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item Row
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          {isEditing ? (
            <table className="w-full text-xs text-left">
              <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
                <tr>
                  <th className="py-2.5 px-3 min-w-[160px]">Product Name *</th>
                  <th className="py-2.5 px-3 w-[120px]">Code / Model</th>
                  <th className="py-2.5 px-3 min-w-[140px]">Description</th>
                  <th className="py-2.5 px-3 w-[100px] text-right">MRP (₹)</th>
                  <th className="py-2.5 px-3 w-[110px] text-right">Offer Price (₹) *</th>
                  <th className="py-2.5 px-3 w-[70px] text-center">Qty *</th>
                  <th className="py-2.5 px-3 w-[110px] text-right">Line Total</th>
                  <th className="py-2.5 px-2 w-[40px] text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {editItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        required
                        placeholder="Product Name"
                        value={item.product_name}
                        onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                        className="w-full p-1.5 border border-[#e2e8f0] rounded outline-none focus:border-[#2563eb]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Code"
                        value={item.product_code || ''}
                        onChange={(e) => handleItemChange(idx, 'product_code', e.target.value)}
                        className="w-full p-1.5 border border-[#e2e8f0] rounded outline-none focus:border-[#2563eb]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full p-1.5 border border-[#e2e8f0] rounded outline-none focus:border-[#2563eb]"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        placeholder="MRP"
                        value={item.mrp || ''}
                        onChange={(e) => handleItemChange(idx, 'mrp', e.target.value)}
                        className="w-full p-1.5 border border-[#e2e8f0] rounded text-right outline-none focus:border-[#2563eb]"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        required
                        placeholder="Offer"
                        value={item.offer_price}
                        onChange={(e) => handleItemChange(idx, 'offer_price', e.target.value)}
                        className="w-full p-1.5 border border-[#e2e8f0] rounded text-right outline-none focus:border-[#2563eb]"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min={1}
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full p-1.5 border border-[#e2e8f0] rounded text-center outline-none focus:border-[#2563eb]"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-extrabold text-[#0f172a]">
                      ₹{((Number(item.offer_price) || 0) * (Number(item.quantity) || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={editItems.length === 1}
                        className="p-1 text-[#ef4444] hover:bg-[#fee2e2] rounded disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-[#e2e8f0] text-xs">
                <tr>
                  <td colSpan={6} className="py-2 px-4 text-right text-[#64748b] font-medium">
                    Subtotal:
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-[#0f172a]">
                    ₹{currentSubtotal.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={6} className="py-2 px-4 text-right text-[#64748b] font-medium">
                    Token / Advance Paid:
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-[#16a34a]">
                    ₹{currentToken.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
                <tr className="text-sm font-extrabold text-[#2563eb]">
                  <td colSpan={6} className="py-3 px-4 text-right">
                    Due Amount:
                  </td>
                  <td className="py-3 px-3 text-right">
                    ₹{currentDue.toLocaleString('en-IN')}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ) : (
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
                    ₹{currentSubtotal.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="py-2 px-4 text-right text-[#64748b] font-medium">
                    Token / Advance Paid:
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-[#16a34a]">
                    ₹{currentToken.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr className="text-sm font-extrabold text-[#2563eb]">
                  <td colSpan={6} className="py-3 px-4 text-right">
                    Due Amount:
                  </td>
                  <td className="py-3 px-4 text-right">
                    ₹{currentDue.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
