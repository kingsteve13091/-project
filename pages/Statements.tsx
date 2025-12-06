
import React, { useState, useRef } from 'react';
import { useFinanceData } from '../services/storage';
import { AccountType } from '../types';
import { Download, Printer, Loader } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const Statements = () => {
  const { getTrialBalance, data, t } = useFinanceData();
  const [activeTab, setActiveTab] = useState<'balance' | 'income' | 'cash'>('balance');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Standard balances (Post-Closing) for Balance Sheet
  const standardBalances = getTrialBalance();

  // Operational balances (Pre-Closing) for Income Statement
  const getOperationalBalances = () => {
    const balances: Record<string, number> = {};
    data.accounts.forEach(a => balances[a.id] = 0);
    data.vouchers.forEach(v => {
      if (v.voucherNumber.startsWith('SYS-CLOSE')) return;
      v.entries.forEach(e => {
        if (balances[e.accountId] !== undefined) {
          balances[e.accountId] += (e.debit - e.credit);
        }
      });
    });
    return balances;
  };

  const operationalBalances = getOperationalBalances();

  const getBalance = (balances: Record<string, number>, accId: string, type: AccountType) => {
    const bal = balances[accId] || 0;
    if (type === AccountType.ASSET || type === AccountType.EXPENSE) return bal;
    return -bal;
  };

  const getNetBalanceByType = (balances: Record<string, number>, type: AccountType) => {
    let total = 0;
    data.accounts.filter(a => a.type === type).forEach(acc => {
       total += getBalance(balances, acc.id, type);
    });
    return total;
  };

  // Balance Sheet Data
  const assets = getNetBalanceByType(standardBalances, AccountType.ASSET);
  const liabilities = getNetBalanceByType(standardBalances, AccountType.LIABILITY);
  const equity = getNetBalanceByType(standardBalances, AccountType.EQUITY);
  
  // Income Statement Data
  const revenueOp = getNetBalanceByType(operationalBalances, AccountType.REVENUE);
  const expenseOp = getNetBalanceByType(operationalBalances, AccountType.EXPENSE);
  const netIncomeOp = revenueOp - expenseOp;

  // Calculated Net Income for Balance Sheet
  const revenueStd = getNetBalanceByType(standardBalances, AccountType.REVENUE);
  const expenseStd = getNetBalanceByType(standardBalances, AccountType.EXPENSE);
  const netIncomeStd = revenueStd - expenseStd;

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      const reportName = activeTab === 'balance' ? 'BalanceSheet' : activeTab === 'income' ? 'IncomeStatement' : 'CashFlow';
      pdf.save(`${data.settings.companyName}_${reportName}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (error) {
      console.error('PDF Export failed', error);
      alert('Export PDF failed, please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const sortedAccounts = [...data.accounts].sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('statements.title')}</h1>
        <button 
          onClick={handleExportPDF} 
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
          {t('statements.export_pdf')}
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 print:hidden">
        {[
          { id: 'balance', label: t('statements.balance_sheet') },
          { id: 'income', label: t('statements.income_statement') },
          { id: 'cash', label: t('statements.cash_flow') }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 border-b-2 font-bold text-sm transition-colors ${
              activeTab === tab.id 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Container - Paper Look */}
      <div className="flex justify-center bg-slate-100 dark:bg-slate-900/50 py-8 print:bg-white print:p-0">
        <div ref={reportRef} className="w-full max-w-[210mm] bg-white dark:bg-slate-800 p-12 shadow-2xl shadow-slate-300/50 dark:shadow-black/50 print:shadow-none print:p-0 min-h-[297mm]">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{data.settings.companyName}</h2>
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-widest border-b-2 border-slate-900 dark:border-white inline-block pb-1">
              {activeTab === 'balance' ? t('statements.balance_sheet') : activeTab === 'income' ? t('statements.income_statement') : t('statements.cash_flow')}
            </h3>
            <p className="text-sm text-slate-400 mt-3 font-mono">{t('statements.generated_on')}: {new Date().toISOString().slice(0,10)} | {t('common.unit')}: {data.settings.currency}</p>
          </div>

          {activeTab === 'balance' && (
            <div className="grid grid-cols-2 gap-x-16 gap-y-8 text-sm">
               {/* Assets Side */}
               <div className="flex flex-col h-full">
                 <div className="flex justify-between items-end border-b-2 border-slate-800 dark:border-slate-200 pb-2 mb-4">
                   <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{t('statements.assets')}</h4>
                 </div>
                 
                 <div className="flex-1 space-y-1">
                   {sortedAccounts.filter(a => a.type === AccountType.ASSET).map(a => {
                      const bal = getBalance(standardBalances, a.id, AccountType.ASSET);
                      if (Math.abs(bal) < 0.01) return null;
                      return (
                        <div key={a.id} className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/50 group">
                          <span className="text-slate-700 dark:text-slate-300 pl-2 group-hover:pl-3 transition-all">
                             <span className="font-mono text-slate-400 text-xs mr-3">{a.code}</span>
                             {a.name}
                          </span>
                          <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{bal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> 
                        </div>
                      );
                   })}
                 </div>

                 <div className="flex justify-between py-3 font-bold text-base mt-6 border-t-2 border-slate-800 dark:border-slate-200 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/20 px-4">
                   <span>{t('statements.total_assets')}</span>
                   <span className="font-mono">{assets.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                 </div>
               </div>

               {/* Liabilities & Equity Side */}
               <div className="flex flex-col h-full">
                 <div className="flex justify-between items-end border-b-2 border-slate-800 dark:border-slate-200 pb-2 mb-4">
                   <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{t('statements.liabilities_equity')}</h4>
                 </div>
                 
                 <div className="flex-1">
                    {/* Liabilities */}
                    <div className="mb-8">
                      <h5 className="font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> {t('statements.liabilities')}
                      </h5>
                      <div className="space-y-1 ml-4">
                        {sortedAccounts.filter(a => a.type === AccountType.LIABILITY).map(a => {
                            const bal = getBalance(standardBalances, a.id, AccountType.LIABILITY);
                            if (Math.abs(bal) < 0.01) return null;
                            return (
                              <div key={a.id} className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/50 group">
                                <span className="text-slate-700 dark:text-slate-300 pl-2 group-hover:pl-3 transition-all">
                                  <span className="font-mono text-slate-400 text-xs mr-3">{a.code}</span>
                                  {a.name}
                                </span>
                                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{bal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> 
                              </div>
                            );
                        })}
                        <div className="flex justify-between py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border-t border-dashed border-slate-300 mt-2">
                            <span>{t('statements.total_liabilities')}</span>
                            <span className="font-mono">{liabilities.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equity */}
                    <div>
                      <h5 className="font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> {t('statements.equity')}
                      </h5>
                      <div className="space-y-1 ml-4">
                        {sortedAccounts.filter(a => a.type === AccountType.EQUITY).map(a => {
                            const bal = getBalance(standardBalances, a.id, AccountType.EQUITY);
                            if (Math.abs(bal) < 0.01) return null;
                            return (
                              <div key={a.id} className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/50 group">
                                <span className="text-slate-700 dark:text-slate-300 pl-2 group-hover:pl-3 transition-all">
                                  <span className="font-mono text-slate-400 text-xs mr-3">{a.code}</span>
                                  {a.name}
                                </span>
                                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{bal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span> 
                              </div>
                            );
                        })}
                        
                        {Math.abs(netIncomeStd) > 0.001 && (
                          <div className="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-700/50 bg-emerald-50/50 dark:bg-emerald-900/10 -mx-2 px-2 rounded">
                              <span className="text-slate-700 dark:text-slate-300 pl-2 font-medium">
                                  <span className="font-mono text-slate-400 text-xs mr-3">{t('statements.calc')}</span>
                                  {t('statements.retained_earnings')}
                              </span>
                              <span className={`font-mono font-bold ${netIncomeStd >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600'}`}>
                                  {netIncomeStd.toLocaleString('en-US', {minimumFractionDigits: 2})}
                              </span>
                          </div>
                        )}

                        <div className="flex justify-between py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border-t border-dashed border-slate-300 mt-2">
                            <span>{t('statements.total_equity')}</span>
                            <span className="font-mono">{(equity + netIncomeStd).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                        </div>
                      </div>
                    </div>
                 </div>

                 <div className="flex justify-between py-3 font-bold text-base mt-6 border-t-2 border-slate-800 dark:border-slate-200 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/20 px-4">
                   <span>{t('statements.total_liabilities_equity')}</span>
                   <span className="font-mono">{(liabilities + equity + netIncomeStd).toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'income' && (
            <div className="max-w-3xl mx-auto space-y-1 text-sm">
               <div className="flex justify-between items-center py-3 border-b-2 border-slate-800 dark:border-slate-200">
                 <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">{t('statements.operating_revenue')}</span>
                 <span className="font-bold text-slate-900 dark:text-white font-mono text-lg">¥{revenueOp.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
               </div>
               {sortedAccounts.filter(a => a.type === AccountType.REVENUE).map(a => {
                   const bal = getBalance(operationalBalances, a.id, AccountType.REVENUE);
                   if (bal === 0) return null;
                   return (
                      <div key={a.id} className="flex justify-between items-center py-2 pl-8 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                          <span className="text-slate-600 dark:text-slate-400">
                             <span className="font-mono text-slate-300 text-xs mr-3">{a.code}</span>
                             {a.name}
                          </span>
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{bal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                      </div>
                   );
               })}

               <div className="flex justify-between items-center py-3 border-b-2 border-slate-800 dark:border-slate-200 mt-8">
                 <span className="font-bold text-slate-800 dark:text-slate-200 text-lg">{t('statements.operating_cost')}</span>
                 <span className="font-bold text-slate-900 dark:text-white font-mono text-lg">(¥{expenseOp.toLocaleString('en-US', {minimumFractionDigits: 2})})</span>
               </div>
               {sortedAccounts.filter(a => a.type === AccountType.EXPENSE).map(a => {
                   const bal = getBalance(operationalBalances, a.id, AccountType.EXPENSE);
                   if (bal === 0) return null;
                   return (
                      <div key={a.id} className="flex justify-between items-center py-2 pl-8 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                          <span className="text-slate-600 dark:text-slate-400">
                             <span className="font-mono text-slate-300 text-xs mr-3">{a.code}</span>
                             - {a.name}
                          </span>
                          <span className="font-mono font-medium text-slate-800 dark:text-slate-200">({bal.toLocaleString('en-US', {minimumFractionDigits: 2})})</span>
                      </div>
                   );
               })}

               <div className="flex justify-between items-center py-6 border-t-2 border-slate-900 dark:border-slate-100 font-bold text-2xl bg-slate-50 dark:bg-slate-700/20 px-6 mt-12 rounded-lg">
                 <span className="text-slate-900 dark:text-white">{t('statements.net_profit')}</span>
                 <span className={`font-mono ${netIncomeOp >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                   ¥{netIncomeOp.toLocaleString('en-US', {minimumFractionDigits: 2})}
                 </span>
               </div>
            </div>
          )}

          {activeTab === 'cash' && (
            <div className="text-center text-slate-500 dark:text-slate-400 py-32 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/30 dark:bg-slate-800/30">
              <Download size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium text-lg">{t('statements.cash_flow')}</p>
              <p className="text-sm mt-3 max-w-md mx-auto leading-relaxed">
                {t('statements.cash_flow_wip')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statements;
