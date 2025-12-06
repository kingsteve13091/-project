
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Check, FileText, Search, Filter, CheckCircle, Lock, ClipboardCheck } from 'lucide-react';

const Vouchers = () => {
  const { data, updateVoucherStatus } = useFinanceData();
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
      className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
        statusFilter === id 
          ? 'text-slate-900 bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-white dark:ring-slate-600' 
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
        statusFilter === id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
      }`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Vouchers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Review, approve and post accounting vouchers.</p>
        </div>
        <div className="flex gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
           <TabButton id="all" label="All" count={counts.all} />
           <TabButton id="draft" label="Draft" count={counts.draft} />
           <TabButton id="reviewed" label="Reviewed" count={counts.reviewed} />
           <TabButton id="posted" label="Posted" count={counts.posted} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-12rem)]">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter vouchers..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wider">
             <Filter size={14} />
             <span>{filteredVouchers.length} Records</span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 w-48 text-xs uppercase tracking-wider">Voucher / Date</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-xs uppercase tracking-wider">Entries</th>
                <th className="px-6 py-3 text-center w-32 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right w-40 text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredVouchers.map(voucher => (
                <tr key={voucher.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2">
                       <FileText size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                       <span className="font-semibold text-slate-700 dark:text-slate-200 font-mono">{voucher.voucherNumber}</span>
                    </div>
                    <div className="text-xs text-slate-400 ml-6 mt-1 font-mono">{voucher.date}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-slate-800 dark:text-slate-200 font-medium max-w-xs">{voucher.description}</div>
                    <div className="text-xs text-slate-400 mt-1">By: {voucher.createdBy}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      {voucher.entries.map((entry, idx) => (
                        <div key={idx} className="flex justify-between text-xs items-center">
                          <span className="text-slate-500 dark:text-slate-400 truncate flex-1 mr-4 max-w-[150px]" title={getAccountName(entry.accountId)}>
                            {getAccountName(entry.accountId)}
                          </span>
                          <div className="flex gap-4 text-right font-mono text-slate-700 dark:text-slate-300">
                             <span className={`w-16 ${entry.debit ? 'opacity-100' : 'opacity-20'}`}>
                               {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                             </span>
                             <span className={`w-16 ${entry.credit ? 'opacity-100' : 'opacity-20'}`}>
                               {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                             </span>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-slate-100 dark:border-slate-700 mt-1.5 pt-1.5 flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                         <span>Total</span>
                         <div className="flex gap-4 text-right font-mono">
                             <span className="w-16">¥{voucher.entries.reduce((s,e)=>s+e.debit,0).toLocaleString()}</span>
                             <span className="w-16">¥{voucher.entries.reduce((s,e)=>s+e.credit,0).toLocaleString()}</span>
                         </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                      voucher.status === 'posted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                      voucher.status === 'reviewed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' :
                      'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600'
                    }`}>
                      {voucher.status === 'posted' ? 'POSTED' : voucher.status === 'reviewed' ? 'REVIEWED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {voucher.status === 'draft' && (
                        <button 
                          onClick={() => updateVoucherStatus(voucher.id, 'reviewed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300 transition-colors shadow-sm"
                        >
                          <ClipboardCheck size={14} /> Review
                        </button>
                      )}
                      {voucher.status === 'reviewed' && (
                        <button 
                          onClick={() => updateVoucherStatus(voucher.id, 'posted')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors shadow-sm"
                        >
                          <Check size={14} /> Post
                        </button>
                      )}
                      {voucher.status === 'posted' && (
                        <span className="text-xs text-slate-300 dark:text-slate-600 flex items-center justify-end gap-1 px-3 py-1.5">
                          <Lock size={14} /> Locked
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400">
                    No vouchers found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vouchers;
