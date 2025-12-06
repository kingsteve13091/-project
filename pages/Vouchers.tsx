
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Check, FileText, Search, Filter, Lock, ClipboardCheck, Printer } from 'lucide-react';

const Vouchers = () => {
  const { data, updateVoucherStatus, t } = useFinanceData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'reviewed' | 'posted'>('all');

  const getAccountName = (id: string) => data.accounts.find(a => a.id === id)?.name || id;

  const filteredVouchers = data.vouchers.filter(v => {
    const matchesSearch = 
      v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: data.vouchers.length,
    draft: data.vouchers.filter(v => v.status === 'draft').length,
    reviewed: data.vouchers.filter(v => v.status === 'reviewed').length,
    posted: data.vouchers.filter(v => v.status === 'posted').length
  };

  const TabButton = ({ id, label, count }: { id: typeof statusFilter, label: string, count: number }) => (
    <button
      onClick={() => setStatusFilter(id)}
      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
        statusFilter === id 
          ? 'text-indigo-700 bg-indigo-50 border border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800' 
          : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
        statusFilter === id ? 'bg-indigo-200/50 dark:bg-indigo-900' : 'bg-slate-200 dark:bg-slate-700'
      }`}>
        {count}
      </span>
    </button>
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('vouchers.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('vouchers.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handlePrint}
             className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
             title={t('vouchers.print')}
           >
             <Printer size={18} />
           </button>
           <div className="flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <TabButton id="all" label={t('vouchers.all')} count={counts.all} />
             <TabButton id="draft" label={t('vouchers.draft')} count={counts.draft} />
             <TabButton id="reviewed" label={t('vouchers.reviewed')} count={counts.reviewed} />
             <TabButton id="posted" label={t('vouchers.posted')} count={counts.posted} />
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-12rem)] print:shadow-none print:border-none print:h-auto">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center print:hidden">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t('vouchers.search_placeholder')} 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
             <Filter size={12} />
             <span>{filteredVouchers.length} {t('vouchers.count')}</span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 print:overflow-visible">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 print:static">
              <tr>
                <th className="px-6 py-3 w-40 text-[10px] uppercase tracking-wider">{t('vouchers.table_no')}</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider">{t('vouchers.table_desc')}</th>
                <th className="px-6 py-3 text-[10px] uppercase tracking-wider">{t('vouchers.table_details')}</th>
                <th className="px-6 py-3 text-center w-32 text-[10px] uppercase tracking-wider print:hidden">{t('vouchers.table_status')}</th>
                <th className="px-6 py-3 text-right w-40 text-[10px] uppercase tracking-wider print:hidden">{t('vouchers.table_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredVouchers.map(voucher => (
                <tr key={voucher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group print:break-inside-avoid">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2">
                       <FileText size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors print:hidden" />
                       <span className="font-bold text-slate-700 dark:text-slate-200 font-mono text-xs">{voucher.voucherNumber}</span>
                    </div>
                    <div className="text-xs text-slate-400 ml-6 mt-1 font-mono print:ml-0">{voucher.date}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-slate-800 dark:text-slate-200 font-medium text-xs max-w-xs">{voucher.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{t('vouchers.maker')}: {voucher.createdBy}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      {voucher.entries.map((entry, idx) => (
                        <div key={idx} className="flex justify-between text-xs items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded px-1 -mx-1">
                          <span className="text-slate-600 dark:text-slate-300 truncate flex-1 mr-4 max-w-[180px]" title={getAccountName(entry.accountId)}>
                            {getAccountName(entry.accountId)}
                          </span>
                          <div className="flex gap-6 text-right font-mono text-slate-700 dark:text-slate-300">
                             <span className={`w-20 ${entry.debit ? 'opacity-100' : 'opacity-20'}`}>
                               {entry.debit > 0 ? entry.debit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '-'}
                             </span>
                             <span className={`w-20 ${entry.credit ? 'opacity-100' : 'opacity-20'}`}>
                               {entry.credit > 0 ? entry.credit.toLocaleString('en-US', {minimumFractionDigits: 2}) : '-'}
                             </span>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 dark:border-slate-700 mt-1.5 pt-1.5 flex justify-between text-xs font-bold text-slate-900 dark:text-white px-1 -mx-1">
                         <span>{t('vouchers.total')}</span>
                         <div className="flex gap-6 text-right font-mono">
                             <span className="w-20">¥{voucher.entries.reduce((s,e)=>s+e.debit,0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                             <span className="w-20">¥{voucher.entries.reduce((s,e)=>s+e.credit,0).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                         </div>
                      </div>
                    </div>
                    {/* Print Only Signature Area */}
                    <div className="hidden print:flex mt-4 pt-4 border-t border-slate-200 gap-8 text-[10px] text-slate-500">
                        <div>{t('vouchers.sign_maker')}: _________________</div>
                        <div>{t('vouchers.sign_reviewer')}: _________________</div>
                        <div>{t('vouchers.sign_bookkeeper')}: _________________</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-center print:hidden">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      voucher.status === 'posted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                      voucher.status === 'reviewed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' :
                      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600'
                    }`}>
                      {voucher.status === 'posted' ? t('vouchers.posted') : voucher.status === 'reviewed' ? t('vouchers.reviewed') : t('vouchers.draft')}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top text-right print:hidden">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {voucher.status === 'draft' && (
                        <button 
                          onClick={() => updateVoucherStatus(voucher.id, 'reviewed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300 transition-colors shadow-sm"
                        >
                          <ClipboardCheck size={14} /> {t('vouchers.action_review')}
                        </button>
                      )}
                      {voucher.status === 'reviewed' && (
                        <button 
                          onClick={() => updateVoucherStatus(voucher.id, 'posted')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-sm"
                        >
                          <Check size={14} /> {t('vouchers.action_post')}
                        </button>
                      )}
                      {voucher.status === 'posted' && (
                        <span className="text-xs text-slate-300 dark:text-slate-600 flex items-center justify-end gap-1 px-3 py-1.5">
                          <Lock size={14} /> {t('vouchers.locked')}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vouchers;
