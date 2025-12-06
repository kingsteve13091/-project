import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Plus, Trash2, TrendingUp, TrendingDown, Landmark, Scale, AlertCircle } from 'lucide-react';

const Accounting = () => {
  const { data, addBalanceItem, deleteBalanceItem } = useFinanceData();
  const [newItem, setNewItem] = useState({ name: '', amount: '', type: 'asset' as 'asset' | 'liability' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newItem.name || !newItem.amount) return;
    
    addBalanceItem({
      name: newItem.name,
      amount: Number(newItem.amount),
      type: newItem.type
    });
    setNewItem({ name: '', amount: '', type: 'asset' });
  };

  // 1. 计算资产负债表数据
  const totalAssets = data.assets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = data.liabilities.reduce((sum, a) => sum + a.amount, 0);
  const netWorth = totalAssets - totalLiabilities;

  // 2. 计算损益表累计数据 (Retained Earnings)
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const retainedEarnings = totalIncome - totalExpense;

  // 3. 计算调节项 (初始资金/Owner's Equity)
  // 逻辑: 资产 = 负债 + 所有者权益 + 累计利润
  // 所以: 所有者权益(初始投入) = 净资产 - 累计利润
  const initialEquity = netWorth - retainedEarnings;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">资产负债管理</h1>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Scale size={18} className="text-primary" />
          <span className="text-sm text-slate-500">账面净资产:</span>
          <span className={`text-lg font-bold ${netWorth >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            ¥{netWorth.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 财务平衡分析卡片 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6 relative z-10">
              <Scale className="text-indigo-200" />
              财务平衡试算表
            </h2>
            
            <div className="grid grid-cols-3 gap-8 relative z-10">
              <div>
                <p className="text-indigo-100 text-xs uppercase font-semibold mb-1">账面净资产</p>
                <p className="text-2xl font-bold">¥{netWorth.toLocaleString()}</p>
                <p className="text-xs text-indigo-200 mt-1">资产 - 负债</p>
              </div>
              <div className="text-center border-l border-white/20 border-r">
                <p className="text-indigo-100 text-xs uppercase font-semibold mb-1">累计经营利润</p>
                <p className="text-2xl font-bold">¥{retainedEarnings.toLocaleString()}</p>
                <p className="text-xs text-indigo-200 mt-1">历史总收入 - 总支出</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-100 text-xs uppercase font-semibold mb-1">初始资金/调节项</p>
                <p className="text-2xl font-bold text-emerald-300">¥{initialEquity.toLocaleString()}</p>
                <p className="text-xs text-indigo-200 mt-1">自动计算偏差</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 text-xs text-indigo-100 flex items-start gap-2">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <p>系统自动计算逻辑：当前净资产 ({netWorth}) = 累计利润 ({retainedEarnings}) + 初始投入 ({initialEquity})。如果“初始资金”显示金额，代表您在开始记账前的原始资本存量。</p>
            </div>
         </div>

         {/* 快速添加表单 */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Plus size={18} className="text-primary" />
              新增条目
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">类型</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setNewItem({...newItem, type: 'asset'})} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${newItem.type === 'asset' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>资产</button>
                  <button type="button" onClick={() => setNewItem({...newItem, type: 'liability'})} className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${newItem.type === 'liability' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>负债</button>
                </div>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="名称 (如: 现金)"
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input 
                  type="number" 
                  placeholder="¥0.00"
                  value={newItem.amount}
                  onChange={(e) => setNewItem({...newItem, amount: e.target.value})}
                  className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button type="submit" className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                添加记录
              </button>
            </form>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assets Column */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 bg-emerald-50/30 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded text-emerald-600">
                 <TrendingUp size={16} />
              </div>
              总资产
            </h3>
            <span className="font-bold text-emerald-600 text-lg">¥{totalAssets.toLocaleString()}</span>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {data.assets.length > 0 ? (
              data.assets.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <Landmark size={14} />
                    </div>
                    <div>
                       <span className="block font-medium text-slate-700">{item.name}</span>
                       <span className="block text-xs text-slate-400">资产项目</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900">¥{item.amount.toLocaleString()}</span>
                    <button 
                      onClick={() => deleteBalanceItem(item.id, 'asset')}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                 <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <Landmark size={24} />
                 </div>
                 <p className="text-slate-400 text-sm">暂无资产记录</p>
              </div>
            )}
          </div>
        </div>

        {/* Liabilities Column */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-100 bg-rose-50/30 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 rounded text-rose-600">
                 <TrendingDown size={16} />
              </div>
              总负债
            </h3>
            <span className="font-bold text-rose-600 text-lg">¥{totalLiabilities.toLocaleString()}</span>
          </div>
          <div className="divide-y divide-slate-50 flex-1">
            {data.liabilities.length > 0 ? (
              data.liabilities.map(item => (
                <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <TrendingDown size={14} />
                    </div>
                    <div>
                       <span className="block font-medium text-slate-700">{item.name}</span>
                       <span className="block text-xs text-slate-400">负债项目</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900">¥{item.amount.toLocaleString()}</span>
                    <button 
                       onClick={() => deleteBalanceItem(item.id, 'liability')}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                 <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <TrendingDown size={24} />
                 </div>
                 <p className="text-slate-400 text-sm">暂无负债记录</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounting;