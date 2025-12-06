
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Download, Upload, Plus, Trash2, Settings as SettingsIcon, AlertTriangle, Moon, Sun, FileSpreadsheet, Building2, Coins, Save, Languages, Globe } from 'lucide-react';
import * as XLSX from 'xlsx';

const Settings = () => {
  const { data, updateSettings, importData, resetData, toggleTheme, toggleLanguage, addCategory, removeCategory, t } = useFinanceData();
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');
  
  // Local state for company profile to allow editing before saving
  const [companyName, setCompanyName] = useState(data.settings.companyName);
  const [currency, setCurrency] = useState(data.settings.currency);

  const handleSaveProfile = () => {
    updateSettings({ companyName, currency });
    alert(t('common.success'));
  };

  const handleAddIncomeCat = (e: React.FormEvent) => {
    e.preventDefault();
    if(newIncomeCat.trim()) {
      addCategory('income', newIncomeCat.trim());
      setNewIncomeCat('');
    }
  };

  const handleAddExpenseCat = (e: React.FormEvent) => {
    e.preventDefault();
    if(newExpenseCat.trim()) {
      addCategory('expense', newExpenseCat.trim());
      setNewExpenseCat('');
    }
  };

  const handleExportExcel = () => {
    // 1. Prepare Data for "Journal Entries" (Flattened Vouchers)
    const journalData = data.vouchers.flatMap(v => 
      v.entries.map(e => ({
        "日期": v.date,
        "凭证号": v.voucherNumber,
        "摘要": v.description,
        "科目代码": data.accounts.find(a => a.id === e.accountId)?.code || '',
        "科目名称": data.accounts.find(a => a.id === e.accountId)?.name || '未知科目',
        "借方金额": e.debit,
        "贷方金额": e.credit,
        "状态": v.status === 'posted' ? '已过账' : v.status === 'reviewed' ? '已审核' : '草稿',
        "制单人": v.createdBy
      }))
    );

    // 2. Prepare Data for "Chart of Accounts"
    const accountData = data.accounts.map(a => ({
      "代码": a.code,
      "名称": a.name,
      "类别": a.type
    }));

    // 3. Prepare Data for "Fixed Assets"
    const assetData = data.fixedAssets.map(fa => ({
      "资产名称": fa.name,
      "购入日期": fa.purchaseDate,
      "原值": fa.originalValue,
      "残值": fa.salvageValue,
      "使用年限": fa.lifeYears,
      "累计折旧": fa.accumulatedDepreciation,
      "净值": fa.originalValue - fa.accumulatedDepreciation
    }));

    // 4. Create Workbook
    const wb = XLSX.utils.book_new();

    const wsJournal = XLSX.utils.json_to_sheet(journalData);
    const wsAccounts = XLSX.utils.json_to_sheet(accountData);
    const wsAssets = XLSX.utils.json_to_sheet(assetData);

    // Auto-width columns for Journal
    const wscols = [
      {wch: 12}, {wch: 20}, {wch: 30}, {wch: 10}, {wch: 20}, {wch: 12}, {wch: 12}, {wch: 10}, {wch: 10}
    ];
    wsJournal['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, wsJournal, "序时账 (Journal)");
    XLSX.utils.book_append_sheet(wb, wsAccounts, "科目表 (Accounts)");
    XLSX.utils.book_append_sheet(wb, wsAssets, "固定资产 (Assets)");

    // 5. Download
    XLSX.writeFile(wb, `Finance_Export_${data.settings.companyName}_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if(event.target?.result) {
          const success = importData(event.target.result as string);
          if(success) alert(t('common.success'));
          else alert('文件格式错误或数据损坏。注意：仅支持导入本系统导出的 JSON 备份文件，不支持 Excel 导入。');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_system_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleReset = () => {
    if(window.confirm('警告：此操作将永久删除所有凭证、科目和日志。是否继续？')) {
      resetData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1">{t('settings.subtitle')}</p>
         </div>
      </div>

      {/* Company Profile Section */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
             <Building2 size={20} />
           </div>
           <div>
             <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings.profile')}</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t('settings.profile_desc')}</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('settings.company_name')}</label>
             <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  placeholder="请输入公司全称"
                />
             </div>
           </div>
           
           <div className="space-y-2">
             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('settings.currency')}</label>
             <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono"
                  placeholder="¥, $, €..."
                />
             </div>
           </div>
        </div>
        
        <div className="mt-6 flex justify-end">
           <button 
             onClick={handleSaveProfile}
             className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors shadow-sm"
           >
             <Save size={16} /> {t('settings.save_changes')}
           </button>
        </div>
      </section>

      {/* Theme & Language */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between">
               <div>
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings.theme')}</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('settings.theme_desc')}</p>
               </div>
               <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                 <button 
                   onClick={() => data.settings.theme !== 'light' && toggleTheme()}
                   className={`p-2 rounded-md transition-all ${data.settings.theme === 'light' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                 >
                   <Sun size={20} />
                 </button>
                 <button 
                   onClick={() => data.settings.theme !== 'dark' && toggleTheme()}
                   className={`p-2 rounded-md transition-all ${data.settings.theme === 'dark' ? 'bg-slate-700 shadow text-indigo-400' : 'text-slate-500'}`}
                 >
                   <Moon size={20} />
                 </button>
               </div>
            </div>

            <div className="flex items-center justify-between">
               <div>
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('settings.language')}</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('settings.language_desc')}</p>
               </div>
               <button 
                 onClick={toggleLanguage}
                 className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-bold text-sm"
               >
                 <Globe size={18} />
                 {data.settings.language === 'en' ? 'English' : '中文'}
               </button>
            </div>
        </div>
      </section>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Income */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {t('settings.income_cat')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('settings.income_cat_desc')}</p>
          </div>
          
          <div className="flex-1">
             <div className="flex flex-wrap gap-2 mb-6">
              {data.settings.incomeCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-full text-sm text-emerald-700 dark:text-emerald-300 group transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/50">
                  {cat}
                  <button onClick={() => removeCategory('income', cat)} className="text-emerald-400 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
            <input 
              type="text" 
              value={newIncomeCat}
              onChange={(e) => setNewIncomeCat(e.target.value)}
              placeholder={t('settings.add_cat')}
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 outline-none text-sm text-slate-900 dark:text-slate-200"
            />
            <button 
              onClick={handleAddIncomeCat}
              className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Expense */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {t('settings.expense_cat')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('settings.expense_cat_desc')}</p>
          </div>

          <div className="flex-1">
             <div className="flex flex-wrap gap-2 mb-6">
              {data.settings.expenseCategories.map(cat => (
                <span key={cat} className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 rounded-full text-sm text-rose-700 dark:text-rose-300 group transition-all hover:bg-rose-100 dark:hover:bg-rose-900/50">
                  {cat}
                  <button onClick={() => removeCategory('expense', cat)} className="text-rose-400 hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
            <input 
              type="text" 
              value={newExpenseCat}
              onChange={(e) => setNewExpenseCat(e.target.value)}
              placeholder={t('settings.add_cat')}
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-2 focus:ring-rose-100 dark:focus:ring-rose-900 outline-none text-sm text-slate-900 dark:text-slate-200"
            />
            <button 
              onClick={handleAddExpenseCat}
              className="bg-rose-600 text-white p-2 rounded-lg hover:bg-rose-700 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('settings.data_mgmt')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
           {t('settings.data_mgmt_desc')}
        </p>
        <div className="flex flex-col gap-4">
           {/* Excel Export Row */}
           <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="mb-2 sm:mb-0">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <FileSpreadsheet size={16} className="text-emerald-600" /> 
                   {t('settings.export_excel')}
                 </h3>
                 <p className="text-xs text-slate-500 mt-1">{t('settings.export_excel_desc')}</p>
              </div>
              <button 
                onClick={handleExportExcel}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-200 dark:shadow-none whitespace-nowrap"
              >
                <Download size={16} />
                {t('settings.download_excel')}
              </button>
           </div>

           {/* JSON Backup Row */}
           <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="mb-2 sm:mb-0">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <SettingsIcon size={16} className="text-slate-500" /> 
                   {t('settings.backup_json')}
                 </h3>
                 <p className="text-xs text-slate-500 mt-1">{t('settings.backup_json_desc')}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportJSON}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"
                >
                  <Download size={14} />
                  {t('settings.backup')}
                </button>
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-all">
                  <Upload size={14} />
                  {t('settings.restore')}
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
              </div>
           </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="p-8 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-900/20">
        <div className="flex items-start gap-4">
           <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-full mt-1">
             <AlertTriangle size={24} />
           </div>
           <div>
             <h2 className="text-lg font-bold text-rose-800 dark:text-rose-400">{t('settings.danger_zone')}</h2>
             <p className="text-rose-600/80 dark:text-rose-400/80 text-sm mt-1 mb-4">
               {t('settings.reset_desc')}
             </p>
             <button 
              onClick={handleReset}
              className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg font-medium hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors shadow-sm"
            >
              {t('settings.reset_title')}
            </button>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
