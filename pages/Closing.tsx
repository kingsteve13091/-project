
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Lock, ArrowRight, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const Closing = () => {
  const { data, previewClosingEntry, executeClosing, t } = useFinanceData();
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
    if(!window.confirm(t('closing.confirm_dialog'))) return;
    const [y, m] = selectedMonth.split('-');
    executeClosing(parseInt(y), parseInt(m));
    setPreviewData(null);
    alert(t('closing.success_msg'));
  };

  const getAccountName = (id: string) => data.accounts.find(a => a.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('closing.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400">{t('closing.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
               <Lock size={20} />
             </div>
             <h3 className="font-bold text-slate-900 dark:text-white">{t('closing.status_title')}</h3>
           </div>
           <div className="space-y-4">
             <div>
               <p className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">{t('closing.lock_date')}</p>
               <p className="text-xl font-mono font-medium text-slate-800 dark:text-slate-200">
                 {data.settings.lockDate || t('closing.not_set')}
               </p>
             </div>
             <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
               <AlertCircle size={14} className="inline mr-1 text-indigo-500" />
               {t('closing.lock_warning')}
             </div>
           </div>
        </div>

        {/* Action Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="font-bold text-slate-900 dark:text-white mb-6">{t('closing.execute_title')}</h3>
           
           <div className="flex items-end gap-4 mb-8">
             <div className="flex-1">
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('closing.select_month')}</label>
               <input 
                 type="month" 
                 value={selectedMonth}
                 onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setPreviewData(null);
                 }}
                 className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-slate-700 dark:text-slate-200 font-medium"
               />
             </div>
             <button 
               onClick={handlePreview}
               className="px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
             >
               {t('closing.preview_btn')}
             </button>
           </div>

           {previewData && (
             <div className="animate-in fade-in slide-in-from-top-4 duration-300">
               <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
                 <div className="px-6 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t('closing.preview_title')}</span>
                    <span className="text-xs font-mono text-slate-400">{previewData.endDate}</span>
                 </div>
                 <div className="p-6 grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase">{t('closing.total_revenue')}</p>
                      <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">¥{previewData.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 font-bold uppercase">{t('closing.total_expense')}</p>
                      <p className="text-lg font-mono font-bold text-rose-600 dark:text-rose-400">¥{previewData.totalExpense.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400 font-bold uppercase">{t('closing.net_transfer')}</p>
                      <p className={`text-lg font-mono font-bold ${previewData.netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        ¥{previewData.netProfit.toLocaleString()}
                      </p>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 mb-2">{t('closing.entry_details')}</p>
                    <div className="space-y-1">
                      {previewData.closingEntries.map((e: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-600 dark:text-slate-300 font-mono">
                          <span>{getAccountName(e.accountId)}</span>
                          <span className="text-slate-400">
                            {e.debit > 0 ? `借: ${e.debit.toLocaleString()}` : `贷: ${e.credit.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>

               <div className="flex justify-end">
                  <button 
                    onClick={handleExecute}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
                  >
                    <CheckCircle size={18} /> {t('closing.confirm_btn')}
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
