
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { AccountType } from '../types';
import { Download } from 'lucide-react';

const Statements = () => {
  const { getTrialBalance, data } = useFinanceData();
  const [activeTab, setActiveTab] = useState<'balance' | 'income' | 'cash'>('balance');
  const balances = getTrialBalance();

  const getBalance = (accId: string) => balances[accId] || 0;
  
  // Calculate specific net balance for an account
  const getAccountNetBalance = (accId: string, type: AccountType) => {
      const bal = balances[accId] || 0;
      if (type === AccountType.ASSET || type === AccountType.EXPENSE) {
          return bal; // Debit is positive
      }
      return -bal; // Credit is negative in Trial Balance logic, so negate to show positive Value
  };

  // Helper to sum net balances by type
  const getNetBalanceByType = (type: AccountType) => {
    let total = 0;
    data.accounts.filter(a => a.type === type).forEach(acc => {
       total += getAccountNetBalance(acc.id, type);
    });
    return total;
  };

  const assets = getNetBalanceByType(AccountType.ASSET);
  const liabilities = getNetBalanceByType(AccountType.LIABILITY);
  const equity = getNetBalanceByType(AccountType.EQUITY);
  const revenue = getNetBalanceByType(AccountType.REVENUE);
  const expense = getNetBalanceByType(AccountType.EXPENSE);
  const netIncome = revenue - expense;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">财务报表</h1>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm">
          <Download size={16} /> 导出 / 打印
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 print:hidden">
        {[
          { id: 'balance', label: '资产负债表' },
          { id: 'income', label: '利润表' },
          { id: 'cash', label: '现金流量表' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[800px] print:shadow-none print:border-none print:p-0">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{data.settings.companyName}</h2>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            {activeTab === 'balance' ? '资产负债表 (Balance Sheet)' : activeTab === 'income' ? '利润表 (Income Statement)' : '现金流量表 (Cash Flow)'}
          </h3>
          <p className="text-sm text-slate-400 mt-2">报表日期: {new Date().toISOString().slice(0,10)} | 单位: {data.settings.currency}</p>
        </div>

        {activeTab === 'balance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             {/* Assets Side */}
             <div>
               <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b-2 border-slate-800 dark:border-slate-200 pb-2 mb-4 flex justify-between">
                 <span>资产 (ASSETS)</span>
               </h4>
               
               <div className="space-y-1">
                 {data.accounts.filter(a => a.type === AccountType.ASSET).map(a => {
                    const bal = getAccountNetBalance(a.id, AccountType.ASSET);
                    if (Math.abs(bal) < 0.01) return null;
                    return (
                      <div key={a.id} className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-700/50 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <span className="text-slate-700 dark:text-slate-300 pl-2">{a.name}</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">{bal.toLocaleString()}</span> 
                      </div>
                    );
                 })}
               </div>

               <div className="flex justify-between py-4 font-bold text-lg mt-6 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                 <span>资产总计</span>
                 <span>¥{assets.toLocaleString()}</span>
               </div>
             </div>

             {/* Liabilities & Equity Side */}
             <div>
               <h4 className="font-bold text-slate-800 dark:text-slate-200 border-b-2 border-slate-800 dark:border-slate-200 pb-2 mb-4">
                 负债及所有者权益
               </h4>
               
               {/* Liabilities */}
               <h5 className="font-bold text-slate-600 dark:text-slate-400 mt-2 mb-2 uppercase text-xs tracking-wider">负债 (Liabilities)</h5>
               <div className="space-y-1 mb-6">
                 {data.accounts.filter(a => a.type === AccountType.LIABILITY).map(a => {
                    const bal = getAccountNetBalance(a.id, AccountType.LIABILITY);
                    if (Math.abs(bal) < 0.01) return null;
                    return (
                      <div key={a.id} className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-700/50 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <span className="text-slate-700 dark:text-slate-300 pl-2">{a.name}</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">{bal.toLocaleString()}</span> 
                      </div>
                    );
                 })}
                 <div className="flex justify-between py-2 text-sm font-semibold bg-slate-50 dark:bg-slate-700/20 px-2 rounded">
                    <span>负债合计</span>
                    <span>¥{liabilities.toLocaleString()}</span>
                 </div>
               </div>

               {/* Equity */}
               <h5 className="font-bold text-slate-600 dark:text-slate-400 mt-2 mb-2 uppercase text-xs tracking-wider">所有者权益 (Equity)</h5>
               <div className="space-y-1">
                 {data.accounts.filter(a => a.type === AccountType.EQUITY).map(a => {
                    const bal = getAccountNetBalance(a.id, AccountType.EQUITY);
                    if (Math.abs(bal) < 0.01) return null;
                    return (
                      <div key={a.id} className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-700/50 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <span className="text-slate-700 dark:text-slate-300 pl-2">{a.name}</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">{bal.toLocaleString()}</span> 
                      </div>
                    );
                 })}
                 {/* Calculated Retained Earnings */}
                 <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-700/50 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <span className="text-slate-700 dark:text-slate-300 pl-2">未分配利润 (本年净利)</span>
                    <span className={`font-mono ${netIncome >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600'}`}>
                        {netIncome.toLocaleString()}
                    </span>
                 </div>

                 <div className="flex justify-between py-2 text-sm font-semibold bg-slate-50 dark:bg-slate-700/20 px-2 rounded">
                    <span>权益合计</span>
                    <span>¥{(equity + netIncome).toLocaleString()}</span>
                 </div>
               </div>

               <div className="flex justify-between py-4 font-bold text-lg mt-8 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                 <span>负债及权益总计</span>
                 <span>¥{(liabilities + equity + netIncome).toLocaleString()}</span>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="max-w-3xl mx-auto space-y-1">
             <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700">
               <span className="font-bold text-slate-800 dark:text-slate-200">一、营业收入</span>
               <span className="font-bold text-slate-900 dark:text-white font-mono">¥{revenue.toLocaleString()}</span>
             </div>
             {data.accounts.filter(a => a.type === AccountType.REVENUE).map(a => {
                 const bal = getAccountNetBalance(a.id, AccountType.REVENUE);
                 if (bal === 0) return null;
                 return (
                    <div key={a.id} className="flex justify-between items-center py-2 pl-8 text-sm text-slate-600 dark:text-slate-400">
                        <span>{a.name}</span>
                        <span className="font-mono">{bal.toLocaleString()}</span>
                    </div>
                 );
             })}

             <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-700 mt-4">
               <span className="font-bold text-slate-800 dark:text-slate-200">二、营业成本与费用</span>
               <span className="font-bold text-slate-900 dark:text-white font-mono">(¥{expense.toLocaleString()})</span>
             </div>
             {data.accounts.filter(a => a.type === AccountType.EXPENSE).map(a => {
                 const bal = getAccountNetBalance(a.id, AccountType.EXPENSE);
                 if (bal === 0) return null;
                 return (
                    <div key={a.id} className="flex justify-between items-center py-2 pl-8 text-sm text-slate-600 dark:text-slate-400">
                        <span>减：{a.name}</span>
                        <span className="font-mono">({bal.toLocaleString()})</span>
                    </div>
                 );
             })}

             <div className="flex justify-between items-center py-4 border-t-2 border-slate-800 dark:border-slate-200 font-bold text-xl bg-slate-50 dark:bg-slate-700/20 px-4 mt-8 rounded-lg">
               <span className="text-slate-900 dark:text-white">三、净利润</span>
               <span className={`font-mono ${netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                 ¥{netIncome.toLocaleString()}
               </span>
             </div>
          </div>
        )}

        {activeTab === 'cash' && (
          <div className="text-center text-slate-500 dark:text-slate-400 py-24 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
            <Download size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium">现金流量表 (Cash Flow)</p>
            <p className="text-xs mt-2 max-w-md mx-auto">由于当前版本使用简化凭证录入，建议通过“资产负债表”中的货币资金期初/期末变动进行间接法倒推。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Statements;
