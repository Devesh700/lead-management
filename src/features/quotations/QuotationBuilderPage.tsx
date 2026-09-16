import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { QuotationLineItem, CategoryCode } from '../../types';

interface QuotationBuilderProps {
  preselectedLeadId?: string;
  onNavigate: (page: string, id?: string) => void;
}

export const QuotationBuilderPage: React.FC<QuotationBuilderProps> = ({
  preselectedLeadId,
  onNavigate,
}) => {
  const { leads, addQuotation, currentStaff } = useData();

  const selectedLead = leads.find((l) => l.id === preselectedLeadId) || leads[0];

  const [leadId, setLeadId] = useState<string>(selectedLead ? selectedLead.id : '');
  const [tokenAmount, setTokenAmount] = useState<number>(50000);
  const [validDays, setValidDays] = useState<number>(14);

  // Line items state
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    {
      id: 'li-1',
      product_name: 'Saint-Gobain UPVC Window',
      product_code: 'SG-UPVC-3T',
      description: '3-track sliding, 5ft × 4ft',
      mrp: 32000,
      offer_price: 28500,
      quantity: 4,
      line_total: 114000,
    },
    {
      id: 'li-2',
      product_name: 'Saint-Gobain Glass Panel',
      product_code: 'SG-GL-8MM',
      description: '8mm toughened glass panel',
      mrp: 18000,
      offer_price: 15500,
      quantity: 6,
      line_total: 93000,
    },
  ]);

  const activeLead = leads.find((l) => l.id === leadId) || selectedLead;

  // Recalculate line totals & grand total
  const subtotal = lineItems.reduce((sum, item) => sum + item.offer_price * item.quantity, 0);
  const dueAmount = Math.max(0, subtotal - tokenAmount);

  const handleAddItem = () => {
    const newItem: QuotationLineItem = {
      id: `li-${Date.now()}`,
      product_name: '',
      product_code: '',
      description: '',
      mrp: 0,
      offer_price: 0,
      quantity: 1,
      line_total: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof QuotationLineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'offer_price' || field === 'quantity') {
          updated.line_total = Number(updated.offer_price) * Number(updated.quantity);
        }
        return updated;
      })
    );
  };

  const handleSaveQuotation = (status: 'DRAFT' | 'SHARED') => {
    if (!activeLead) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validDays);
    const validUntilStr = validUntilDate.toISOString().split('T')[0];

    const created = addQuotation({
      lead_id: activeLead.id,
      lead_number: activeLead.lead_number,
      customer_name: activeLead.customer_name,
      category_code: activeLead.category_code as CategoryCode,
      status,
      quote_date: todayStr,
      valid_until: validUntilStr,
      total_amount: subtotal,
      token_amount: tokenAmount,
      due_amount: dueAmount,
      line_items: lineItems,
      created_by: currentStaff.full_name,
    });

    onNavigate('quotation-detail', created.id);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('quotations')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSaveQuotation('DRAFT')}
            className="px-3.5 py-2 rounded-xl border border-[#e2e8f0] bg-white text-xs font-semibold text-[#334155] hover:bg-[#f8fafc]"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSaveQuotation('SHARED')}
            className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" /> Generate & Share Quote
          </button>
        </div>
      </div>

      {/* Linked Lead Details */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#0f172a] border-b border-[#f1f5f9] pb-2.5">
          Quotation Customer Link
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[#475569] mb-1">Select Lead / Customer</label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="w-full p-2 border border-[#e2e8f0] rounded-xl font-semibold text-[#0f172a] outline-none"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.customer_name} ({l.lead_number} · {l.category_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-[#475569] mb-1">Validity (Days)</label>
            <input
              type="number"
              value={validDays}
              onChange={(e) => setValidDays(Number(e.target.value))}
              className="w-full p-2 border border-[#e2e8f0] rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-[#475569] mb-1">Created By</label>
            <input
              type="text"
              disabled
              value={currentStaff.full_name}
              className="w-full p-2 border border-[#e2e8f0] rounded-xl bg-[#f8fafc] text-[#64748b] font-medium"
            />
          </div>
        </div>
      </div>

      {/* Line Items Builder Table */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <h3 className="text-sm font-bold text-[#0f172a]">Quotation Line Items</h3>
          <button
            onClick={handleAddItem}
            className="px-3 py-1.5 rounded-lg bg-[#e0e7ff] text-[#3730a3] text-xs font-bold hover:bg-[#c7d2fe] flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem]">
              <tr>
                <th className="py-2.5 px-3 min-w-[180px]">Product Name</th>
                <th className="py-2.5 px-3">Code / SKU</th>
                <th className="py-2.5 px-3 min-w-[150px]">Description</th>
                <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                <th className="py-2.5 px-3 text-right">Offer Price (₹)</th>
                <th className="py-2.5 px-3 text-center w-16">Qty</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
                <th className="py-2.5 px-2 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {lineItems.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(item.id, 'product_name', e.target.value)}
                      className="w-full p-1.5 border border-[#e2e8f0] rounded font-medium"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="SKU"
                      value={item.product_code || ''}
                      onChange={(e) => handleItemChange(item.id, 'product_code', e.target.value)}
                      className="w-full p-1.5 border border-[#e2e8f0] rounded text-center"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Desc/specs"
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="w-full p-1.5 border border-[#e2e8f0] rounded"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={item.mrp || ''}
                      onChange={(e) => handleItemChange(item.id, 'mrp', Number(e.target.value))}
                      className="w-20 p-1.5 border border-[#e2e8f0] rounded text-right"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      value={item.offer_price}
                      onChange={(e) =>
                        handleItemChange(item.id, 'offer_price', Number(e.target.value))
                      }
                      className="w-24 p-1.5 border border-[#e2e8f0] rounded text-right font-bold text-[#0f172a]"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, 'quantity', Number(e.target.value))
                      }
                      className="w-14 p-1.5 border border-[#e2e8f0] rounded text-center font-bold"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-extrabold text-[#0f172a]">
                    ₹{(item.offer_price * item.quantity).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-[#dc2626] hover:text-[#991b1b]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Totals Footer */}
        <div className="pt-4 border-t border-[#e2e8f0] flex flex-col items-end space-y-2 text-xs">
          <div className="flex justify-between w-64 text-[#64748b] font-medium">
            <span>Subtotal:</span>
            <span className="font-bold text-[#0f172a]">
              ₹{subtotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between items-center w-64 text-[#64748b] font-medium">
            <span>Token / Advance Amount:</span>
            <input
              type="number"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(Number(e.target.value))}
              className="w-28 p-1 border border-[#e2e8f0] rounded text-right font-bold text-[#2563eb]"
            />
          </div>
          <div className="flex justify-between w-64 text-sm font-black text-[#2563eb] pt-2 border-t border-[#e2e8f0]">
            <span>Due Amount:</span>
            <span>₹{dueAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
