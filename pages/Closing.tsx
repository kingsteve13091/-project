
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Lock, ArrowRight, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const Closing = () => {
  const { data, previewClosingEntry, executeClosing } = useFinanceData();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(`${currentYear}-${String(currentMonth).padStart(2,'0')}`);
  const [previewData, setPreviewData] = useState<any>(null);

  const handlePreview = () => {
    const [y, m] = selectedMonth.split('-');
    const result = previewClosingEntry(parseInt(y), parseInt(m));
    setPreviewData(result);
  };

  const handleExecute = () => {
    if(!window.confirm('This will generate a closing voucher and LOCK the period. Continue?')) return;
    const [y, m] = selectedMonth.split('-');
    executeClosing(parseInt(y), parseInt(m));
    setPreviewData(null);
    alert('Month closed successfully.');
  };

  const getAccountName = (id: string) => data.accounts.find(a => a.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Month-End Closing</h1>
        <p className="text-slate-500">Lock the period and transfer Profit & Loss to Retained Earnings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
               <Lock size={20} />
             </div>
             <h3 className="font-bold text-slate-900">Current Status</h3>
           </div>
           <div className="space-y-4">
             <div>
               <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Locked Until</p>
               <p className="text-xl font-mono font-medium text-slate-800">
                 {data.settings.lockDate || 'No Lock Date Set'}
               </p>
             </div>
             <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
               <AlertCircle size={14} className="inline mr-1 text-indigo-500" />
               Vouchers cannot be added or modified before this date.
             </div>
           </div>
        </div>

        {/* Action Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-900 mb-6">Perform Closing</h3>
           
           <div className="flex items-end gap-4 mb-8">
             <div className="flex-1">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Period</label>
               <input 
                 type="month" 
                 value={selectedMonth}
                 onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setPreviewData(null);
                 }}
                 className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 font-medium"
               />
             </div>
             <button 
               onClick={handlePreview}
               className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
             >
               Preview Closing
             </button>
           </div>

           {previewData && (
             <div className="animate-in fade-in slide-in-from-top-4 duration-300">
               <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-6">
                 <div className="px-6 py-3 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Preview: Closing Voucher</span>
                    <span className="text-xs font-mono text-slate-400">{previewData.endDate}</span>
                 </div>
                 <div className="p-6 grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase">Total Revenue</p>
                      <p className="text-lg font-mono font-bold text-emerald-600">¥{previewData.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <p className="text-xs text-slate-400 font-bold uppercase">Total Expense</p>
                      <p className="text-lg font-mono font-bold text-rose-600">¥{previewData.totalExpense.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase">Net P&L Transfer</p>
                      <p className={`text-lg font-mono font-bold ${previewData.netProfit >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>
                        ¥{previewData.netProfit.toLocaleString()}
                      </p>
                    </div>
                 </div>
                 <div className="bg-white p-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-400 mb-2">JOURNAL ENTRIES</p>
                    <div className="space-y-1">
                      {previewData.closingEntries.map((e: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-600 font-mono">
                          <span>{getAccountName(e.accountId)}</span>
                          <span className="text-slate-400">
                            {e.debit > 0 ? `Dr: ${e.debit.toLocaleString()}` : `Cr: ${e.credit.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>

               <div className="flex justify-end">
                  <button 
                    onClick={handleExecute}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                  >
                    <CheckCircle size={18} /> Execute & Lock Period
                  </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Closing;
