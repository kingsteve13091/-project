
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Search, Filter, ArrowLeft, ArrowRight, FileText } from 'lucide-react';

const Records = () => {
  const { data, t } = useFinanceData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Flatten Vouchers into Journal Lines
  const journalLines = data.vouchers.flatMap(v => 
    v.entries.map(entry => ({
      id: `${v.id}-${entry.accountId}`, // unique key
      date: v.date,
      voucherNumber: v.voucherNumber,
      description: v.description,
      accountName: data.accounts.find(a => a.id === entry.accountId)?.name || 'Unknown',
      accountId: entry.accountId,
      debit: entry.debit,
      credit: entry.credit,
      status: v.status
    }))
  );

  // Filter
  const filtered = journalLines.filter(line => {
    const matchesSearch = line.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          line.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = filterAccount === '' || line.accountId === filterAccount;
    return matchesSearch && matchesAccount;
  });

  // Sort by date desc
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('records.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('records.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t('records.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative">
               <select 
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none text-slate-700 dark:text-slate-200 cursor-pointer appearance-none min-w-[150px]"
              >
                <option value="">{t('records.filter_account')}</option>
                {data.accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.code} {acc.name}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">{t('records.date')}</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">{t('records.voucher_no')}</th>
                <th className="px-6 py-4 font-medium w-1/3">{t('records.desc')}</th>
                <th className="px-6 py-4 font-medium">{t('records.account')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('records.debit')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('records.credit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {paginated.length > 0 ? (
                paginated.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-xs">{line.date}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-200 font-medium whitespace-nowrap flex items-center gap-2">
                       <FileText size={14} className="text-slate-400" />
                       {line.voucherNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{line.description}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-xs font-mono">
                        {line.accountName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {line.debit > 0 ? line.debit.toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {line.credit > 0 ? line.credit.toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    {t('records.no_data')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('records.page')} {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
              >
                <ArrowLeft size={16} />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;
