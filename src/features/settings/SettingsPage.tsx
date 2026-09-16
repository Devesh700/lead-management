import React, { useState } from 'react';
import { Layers, Plus, Check, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataContext';
import type { CategoryCode } from '../../types';

export const SettingsPage: React.FC = () => {
  const { categories, addCategory, staff, resetDataToDefault } = useData();

  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catManager, setCatManager] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catCode) return;

    addCategory({
      name: catName,
      code: catCode.toUpperCase() as CategoryCode,
      default_manager_id: catManager || null,
      is_active: true,
    });

    setCatName('');
    setCatCode('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Category List */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 px-5 border-b border-[#f1f5f9] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563eb]" /> Category Verticals
          </h3>
          <span className="text-[0.68rem] uppercase font-bold text-[#3730a3] bg-[#e0e7ff] px-2.5 py-0.5 rounded-full">
            Admin Configurable
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f8fafc] text-[#64748b] uppercase font-bold text-[0.66rem] border-b border-[#e8edf3]">
              <tr>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-3">Prefix Code</th>
                <th className="py-3 px-3">Default Manager</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {categories.map((c) => {
                const manager = staff.find((s) => s.id === c.default_manager_id);
                return (
                  <tr key={c.id}>
                    <td className="py-3.5 px-4 font-bold text-[#0f172a]">{c.name}</td>
                    <td className="py-3.5 px-3">
                      <code className="bg-[#f1f5f9] px-2 py-0.5 rounded font-mono font-bold text-[#2563eb]">
                        {c.code}
                      </code>
                    </td>
                    <td className="py-3.5 px-3 text-[#334155] font-medium">
                      {manager ? manager.full_name : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex px-2 py-0.5 text-[0.66rem] font-bold rounded-full bg-[#dcfce7] text-[#166534]">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Category Form */}
      <div className="bg-white border border-[#e8edf3] rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[#0f172a] flex items-center gap-2 border-b border-[#f1f5f9] pb-3">
          <Plus className="w-4 h-4 text-[#2563eb]" /> Add New Category Vertical
        </h3>

        <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                Category Name <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Modular Wardrobes"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="w-full p-2.5 border border-[#e2e8f0] rounded-xl outline-none focus:border-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                Prefix Code <span className="text-[#dc2626]">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={4}
                placeholder="e.g. WRD"
                value={catCode}
                onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                className="w-full p-2.5 border border-[#e2e8f0] rounded-xl font-mono uppercase outline-none focus:border-[#2563eb]"
              />
              <span className="text-[0.66rem] text-[#94a3b8] font-medium mt-1 block">
                Used as Lead ID prefix (e.g. WRD-00001)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.7rem] font-bold text-[#475569] mb-1">
                Default Manager
              </label>
              <select
                value={catManager}
                onChange={(e) => setCatManager(e.target.value)}
                className="w-full p-2.5 border border-[#e2e8f0] rounded-xl outline-none"
              >
                <option value="">— Select Manager —</option>
                {staff
                  .filter((s) => s.role !== 'SALES_STAFF')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-[#f1f5f9]">
            <button
              type="submit"
              className="px-4 py-2 bg-[#2563eb] text-white font-semibold rounded-xl hover:bg-[#1d4ed8] flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-4 h-4" /> Save Category
            </button>
          </div>
        </form>
      </div>

      {/* Prototype Data Reset Option */}
      <div className="p-4 rounded-2xl bg-[#fef2f2] border border-[#fee2e2] flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-[#991b1b]">Reset Prototype Data</div>
          <div className="text-[0.7rem] text-[#b91c1c]">
            Restore initial test dataset from crm_test_data.json
          </div>
        </div>
        <button
          onClick={resetDataToDefault}
          className="px-3 py-1.5 rounded-lg bg-white border border-[#fca5a5] text-[#dc2626] text-xs font-bold hover:bg-[#fee2e2] flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Data
        </button>
      </div>
    </div>
  );
};
