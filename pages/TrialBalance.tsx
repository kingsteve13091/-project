
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { AccountType } from '../types';
import { Filter, Calendar, Download, RefreshCw, AlertTriangle } from 'lucide-react';

const TrialBalance = () => {
  const { data, getRangeTrialBalance } = useFinanceData();
  
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState({
    start: `${currentYear}-01-01`,
    end: `${currentYear}-12-31`
  });

  const balances = getRangeTrialBalance(dateRange.start, dateRange.end);

  const calculateNet = (debit: number, credit: number, type: AccountType) => {
    if (type === AccountType.ASSET || type === AccountType.EXPENSE) {
      return debit - credit;
    }
    return credit - debit;
  };

  const sortedAccounts = [...data.accounts].sort((a, b) => a.code.localeCompare(b.code));

  const totalDebits = Object.values(balances).reduce((acc, curr) => acc + curr.debit, 0);
  const totalCredits = Object.values(balances).reduce((acc, curr) => acc + curr.credit, 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">科目余额表 (Trial Balance)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">选定期间内所有会计科目的发生额及余额汇总。</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm text-slate-700 dark:text-slate-200 transition-colors">
             <Download size={16} /> 导出 / 打印
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end print:hidden">
        <div className="flex gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">开始日期</label>
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-slate-700 dark:text-slate-200 font-medium"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">结束日期</label>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none text-slate-700 dark:text-slate-200 font-medium"
            />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700">
           <Filter size={14} />
           <span>Range: {dateRange.start} ~ {dateRange.end}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 w-24 text-xs uppercase tracking-wider">科目代码</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider">科目名称</th>
                <th className="px-6 py-4 w-32 text-xs uppercase tracking-wider">类别</th>
                <th className="px-6 py-4 text-right bg-slate-50/30 dark:bg-slate-700/10 text-xs uppercase tracking-wider">借方发生额 (Dr)</th>
                <th className="px-6 py-4 text-right bg-slate-50/30 dark:bg-slate-700/10 text-xs uppercase tracking-wider">贷方发生额 (Cr)</th>
                <th className="px-6 py-4 text-right font-bold bg-slate-50/60 dark:bg-slate-700/20 text-xs uppercase tracking-wider">期末余额 (Net)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {sortedAccounts.map(account => {
                const bal = balances[account.id] || { debit: 0, credit: 0 };
                const net = calculateNet(bal.debit, bal.credit, account.type);
                const isZero = bal.debit === 0 && bal.credit === 0 && net === 0;

                return (
                  <tr key={account.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${isZero ? 'opacity-40' : ''}`}>
                    <td className="px-6 py-3 font-mono text-slate-500 dark:text-slate-400 text-xs">{account.code}</td>
                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{account.name}</td>
                    <td className="px-6 py-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        {account.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-700/10">
                      {bal.debit !== 0 ? `¥${bal.debit.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-600 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-700/10">
                      {bal.credit !== 0 ? `¥${bal.credit.toLocaleString()}` : '-'}
                    </td>
                    <td className={`px-6 py-3 text-right font-mono font-bold bg-slate-50/60 dark:bg-slate-700/20 ${
                      net < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      ¥{net.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right uppercase text-xs tracking-wider text-slate-500">Total / 合计</td>
                <td className="px-6 py-4 text-right font-mono text-indigo-700 dark:text-indigo-400">¥{totalDebits.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono text-indigo-700 dark:text-indigo-400">¥{totalCredits.toLocaleString()}</td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                   {isBalanced ? (
                     <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wide bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800">
                        <RefreshCw size={10} /> Balanced / 试算平衡
                     </span>
                   ) : (
                     <span className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 text-[10px] uppercase tracking-wide bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-800">
                        <AlertTriangle size={10} /> Unbalanced / 不平
                     </span>
                   )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;
