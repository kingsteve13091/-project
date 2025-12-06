
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Download, Upload, Plus, Trash2, Settings as SettingsIcon, AlertTriangle, Moon, Sun, Monitor } from 'lucide-react';

const Settings = () => {
  const { data, updateSettings, importData, resetData, toggleTheme, addCategory, removeCategory } = useFinanceData();
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');

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

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if(event.target?.result) {
          const success = importData(event.target.result as string);
          if(success) alert('Success! Data imported.');
          else alert('Invalid file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if(window.confirm('Warning: This will delete ALL data. Continue?')) {
      resetData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between mb-8">
         <div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
           <p className="text-slate-500 dark:text-slate-400 mt-1">Manage categories, data and preferences.</p>
         </div>
      </div>

      {/* Theme */}
      <section className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
           <div>
             <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appearance</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Customize the interface theme.</p>
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
      </section>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Income */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Income Categories
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Define sources of revenue.</p>
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
              placeholder="New Category..."
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
              Expense Categories
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Define types of expenditures.</p>
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
              placeholder="New Category..."
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
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Data Management</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
           Export your financial data to JSON for backup or migration purposes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 transition-all shadow-sm"
          >
            <Download size={18} />
            Export Backup
          </button>
          <label className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-600 cursor-pointer transition-all shadow-sm">
            <Upload size={18} />
            Import Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="p-8 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-900/20">
        <div className="flex items-start gap-4">
           <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-full mt-1">
             <AlertTriangle size={24} />
           </div>
           <div>
             <h2 className="text-lg font-bold text-rose-800 dark:text-rose-400">Danger Zone</h2>
             <p className="text-rose-600/80 dark:text-rose-400/80 text-sm mt-1 mb-4">
               Resetting the system will permanently delete all vouchers, accounts, and logs. This action cannot be undone.
             </p>
             <button 
              onClick={handleReset}
              className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg font-medium hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors shadow-sm"
            >
              Reset System Data
            </button>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
