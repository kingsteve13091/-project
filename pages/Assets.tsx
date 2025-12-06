import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Plus, Calculator, Cpu } from 'lucide-react';

const Assets = () => {
  const { data, addAsset, runDepreciation } = useFinanceData();
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', val: '', life: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.val || !newItem.life) return;

    addAsset({
      name: newItem.name,
      purchaseDate: new Date().toISOString().slice(0,10),
      originalValue: Number(newItem.val),
      salvageValue: Number(newItem.val) * 0.05, // default 5% salvage
      lifeYears: Number(newItem.life),
      accumulatedDepreciation: 0,
      method: 'straight-line'
    });
    setShowForm(false);
    setNewItem({ name: '', val: '', life: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">固定资产登记</h1>
        <div className="flex gap-2">
           <button 
             onClick={() => runDepreciation()} 
             className="px-4 py-2 bg-white border border-slate-200 text-indigo-700 rounded-lg hover:bg-slate-50 transition-colors flex gap-2 items-center text-sm font-bold shadow-sm"
           >
             <Cpu size={16} /> 执行系统自动折旧
           </button>
           <button 
             onClick={() => setShowForm(!showForm)} 
             className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex gap-2 items-center text-sm font-medium shadow-sm shadow-indigo-200"
           >
             <Plus size={16} /> 新增资产
           </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="font-bold text-slate-800 mb-4">录入新资产</h3>
          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">资产名称</label>
              <input 
                value={newItem.name} 
                onChange={e=>setNewItem({...newItem, name: e.target.value})} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
                placeholder="例如：MacBook Pro" 
              />
            </div>
            <div className="w-full md:w-48">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">原值 (¥)</label>
              <input 
                type="number" 
                value={newItem.val} 
                onChange={e=>setNewItem({...newItem, val: e.target.value})} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
                placeholder="10000" 
              />
            </div>
             <div className="w-full md:w-32">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">年限</label>
              <input 
                type="number" 
                value={newItem.life} 
                onChange={e=>setNewItem({...newItem, life: e.target.value})} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all" 
                placeholder="3" 
              />
            </div>
            <button className="w-full md:w-auto px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm">保存</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">资产名称</th>
              <th className="px-6 py-4">购入日期</th>
              <th className="px-6 py-4 text-right">原值</th>
              <th className="px-6 py-4 text-right">累计折旧 (系统计算)</th>
              <th className="px-6 py-4 text-right">净值</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.fixedAssets.map(asset => (
              <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{asset.name}</td>
                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{asset.purchaseDate}</td>
                <td className="px-6 py-4 text-right font-mono text-slate-600">¥{asset.originalValue.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono text-amber-600">¥{asset.accumulatedDepreciation.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                  ¥{(asset.originalValue - asset.accumulatedDepreciation).toLocaleString()}
                </td>
              </tr>
            ))}
            {data.fixedAssets.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        暂无固定资产记录
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Assets;