
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Save, Plus, ArrowRight, BookOpen, Wand2, Trash2, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Record = () => {
  const { data, addVoucher, t } = useFinanceData();
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<'smart' | 'pro'>('smart');

  // Smart Form Data
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense', 
    category: '', 
    date: new Date().toISOString().slice(0, 10),
    description: '',
    paymentMethod: 'bank'
  });

  // Pro Form Data
  const [proData, setProData] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    entries: [
      { accountId: '', debit: '', credit: '' },
      { accountId: '', debit: '', credit: '' }
    ]
  });

  // --- Smart Logic (unchanged) ---
  const findAccountId = (namePart: string) => {
    const account = data.accounts.find(a => a.name.includes(namePart));
    return account ? account.id : null;
  };

  const smartMapCategoryToAccount = (category: string, type: string) => {
    let accId = findAccountId(category);
    if (accId) return accId;
    if (type === 'expense') {
      if (category.includes('薪') || category.includes('工资')) return findAccountId('应付职工薪酬') || findAccountId('管理费用');
      if (category.includes('税')) return findAccountId('应交税费') || findAccountId('管理费用');
      if (category.includes('推广') || category.includes('广告') || category.includes('营销')) return findAccountId('销售费用');
      if (category.includes('成本') || category.includes('采购')) return findAccountId('主营业务成本');
      return findAccountId('管理费用');
    } else {
      if (category.includes('主营') || category.includes('学费') || category.includes('服务')) return findAccountId('主营业务收入');
      if (category.includes('利息') || category.includes('投资') || category.includes('其他')) return findAccountId('其他业务收入');
      return findAccountId('主营业务收入');
    }
  };

  const handleSmartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;
    const amount = Number(formData.amount);
    const entries = [];
    const paymentAccId = formData.paymentMethod === 'cash' ? findAccountId('库存现金') : findAccountId('银行存款');
    if (!paymentAccId) return alert(t('record.error_account'));
    const businessAccId = smartMapCategoryToAccount(formData.category, formData.type);
    if (!businessAccId) return alert(t('record.error_map'));

    if (formData.type === 'expense') {
      entries.push({ accountId: businessAccId, debit: amount, credit: 0 });
      entries.push({ accountId: paymentAccId, debit: 0, credit: amount });
    } else {
      entries.push({ accountId: paymentAccId, debit: amount, credit: 0 });
      entries.push({ accountId: businessAccId, debit: 0, credit: amount });
    }

    addVoucher({
      date: formData.date,
      description: formData.description || `${formData.category} - ${formData.type === 'expense' ? t('record.expense') : t('record.income')}`,
      entries,
      status: 'draft',
      createdBy: 'SmartForm',
      attachments: []
    });
    alert(t('record.smart_success'));
    setFormData({ ...formData, amount: '', description: '' });
  };

  // --- Pro Logic ---
  const handleProEntryChange = (index: number, field: string, value: string) => {
    const newEntries = [...proData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setProData({ ...proData, entries: newEntries });
  };

  const addProRow = () => {
    setProData({ ...proData, entries: [...proData.entries, { accountId: '', debit: '', credit: '' }] });
  };

  const removeProRow = (index: number) => {
    if(proData.entries.length <= 2) return;
    const newEntries = proData.entries.filter((_, i) => i !== index);
    setProData({ ...proData, entries: newEntries });
  };

  const handleProSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proData.description) return alert(t('record.error_desc'));

    const formattedEntries = proData.entries.map(e => ({
      accountId: e.accountId,
      debit: Number(e.debit) || 0,
      credit: Number(e.credit) || 0
    }));

    const totalDebit = formattedEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = formattedEntries.reduce((s, e) => s + e.credit, 0);

    if(Math.abs(totalDebit - totalCredit) > 0.01) return alert(`${t('record.unbalanced')}!`);
    if(formattedEntries.some(e => !e.accountId)) return alert(t('record.error_entry'));

    addVoucher({
      date: proData.date,
      description: proData.description,
      entries: formattedEntries,
      status: 'reviewed',
      createdBy: 'ProMode',
      attachments: []
    });

    alert(t('record.pro_success'));
    setProData({
      date: new Date().toISOString().slice(0, 10),
      description: '',
      entries: [{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }]
    });
  };

  // Balance Calculation for Pro Mode
  const totalDebit = proData.entries.reduce((s, e) => s + (Number(e.debit)||0), 0);
  const totalCredit = proData.entries.reduce((s, e) => s + (Number(e.credit)||0), 0);
  const difference = totalDebit - totalCredit;
  const isBalanced = Math.abs(difference) < 0.01;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{t('record.title')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{t('record.subtitle')}</p>
        </div>
        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl">
           <button 
             onClick={() => setMode('smart')}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'smart' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
           >
             <Wand2 size={16} /> {t('record.smart_mode')}
           </button>
           <button 
             onClick={() => setMode('pro')}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'pro' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
           >
             <BookOpen size={16} /> {t('record.pro_mode')}
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden relative">
        
        {/* === SMART MODE === */}
        {mode === 'smart' && (
          <div className="p-8 md:p-12 animate-in fade-in slide-in-from-left-4 duration-300">
            <form onSubmit={handleSmartSubmit} className="space-y-10">
              <div className="flex flex-col md:flex-row gap-8">
                 {/* Left Column: Type & Date */}
                 <div className="w-full md:w-1/3 space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('record.type')}</label>
                      <div className="flex gap-3">
                        <button type="button" onClick={()=>setFormData({...formData, type: 'income'})} className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${formData.type === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>{t('record.income')}</button>
                        <button type="button" onClick={()=>setFormData({...formData, type: 'expense'})} className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all ${formData.type === 'expense' ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>{t('record.expense')}</button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('record.date')}</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                 </div>

                 {/* Right Column: Amount & Details */}
                 <div className="flex-1 space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('record.amount')}</label>
                      <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-mono text-slate-300 group-focus-within:text-indigo-500 transition-colors">{data.settings.currency}</span>
                        <input 
                          type="number" step="0.01" placeholder="0.00"
                          className="w-full pl-12 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-4xl font-bold font-mono text-slate-900 dark:text-white placeholder:text-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                          value={formData.amount}
                          onChange={e => setFormData({...formData, amount: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('record.payment_method')}</label>
                         <select 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 text-slate-700 dark:text-white"
                          value={formData.paymentMethod}
                          onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                        >
                          <option value="bank">{t('record.bank')}</option>
                          <option value="cash">{t('record.cash')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('record.category')}</label>
                          <button type="button" onClick={() => navigate('/settings')} className="text-[10px] font-bold text-indigo-600 hover:underline">{t('record.category_manage')}</button>
                        </div>
                        <select 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:border-indigo-500 text-slate-700 dark:text-white"
                          value={formData.category}
                          onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                          <option value="">{t('record.select')}</option>
                          {formData.type === 'expense' ? (
                            data.settings.expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                          ) : (
                            data.settings.incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                          )}
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{t('record.desc')}</label>
                       <input 
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-700 dark:text-white"
                         placeholder={t('record.desc_placeholder')}
                         value={formData.description}
                         onChange={e => setFormData({...formData, description: e.target.value})}
                       />
                    </div>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group">
                  {t('record.generate_btn')} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* === PRO MODE === */}
        {mode === 'pro' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            <form onSubmit={handleProSubmit} className="flex-1 flex flex-col">
              {/* Header Input Area */}
              <div className="p-8 pb-4 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-100 dark:border-slate-700">
                <div className="space-y-2">
                   <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('record.date')}</label>
                   <input 
                     type="date" 
                     className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                     value={proData.date}
                     onChange={e => setProData({...proData, date: e.target.value})}
                   />
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('record.voucher_desc')}</label>
                   <input 
                     type="text" 
                     className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                     placeholder={t('record.voucher_desc_placeholder')}
                     value={proData.description}
                     onChange={e => setProData({...proData, description: e.target.value})}
                   />
                </div>
              </div>

              {/* Grid Area */}
              <div className="p-4 flex-1 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto min-h-[300px]">
                 {/* Table Header */}
                 <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="col-span-1 text-center">{t('record.table_hash')}</div>
                    <div className="col-span-5">{t('record.table_account')}</div>
                    <div className="col-span-3 text-right">{t('record.table_debit')}</div>
                    <div className="col-span-3 text-right">{t('record.table_credit')}</div>
                 </div>
                 
                 {/* Table Rows */}
                 <div className="space-y-1">
                   {proData.entries.map((entry, idx) => (
                     <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 group hover:border-indigo-300 transition-colors">
                        <div className="col-span-1 text-center flex justify-center">
                           <button type="button" onClick={() => removeProRow(idx)} className="text-slate-300 hover:text-rose-500 transition-colors" tabIndex={-1}>
                             {proData.entries.length > 2 ? <Trash2 size={14} /> : <span className="text-xs font-mono text-slate-300">{idx+1}</span>}
                           </button>
                        </div>
                        <div className="col-span-5">
                          <select 
                            className="w-full p-1.5 bg-transparent border-none rounded text-sm outline-none text-slate-900 dark:text-slate-200 focus:bg-slate-50 dark:focus:bg-slate-700"
                            value={entry.accountId}
                            onChange={(e) => handleProEntryChange(idx, 'accountId', e.target.value)}
                          >
                            <option value="">{t('record.select')}</option>
                            {data.accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.code} {acc.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                           <input 
                             type="number" step="0.01"
                             className="w-full p-1.5 bg-transparent border-b border-transparent focus:border-indigo-500 rounded-none text-sm text-right outline-none text-slate-900 dark:text-slate-200 font-mono placeholder:text-slate-200"
                             placeholder="0.00"
                             value={entry.debit}
                             onChange={(e) => handleProEntryChange(idx, 'debit', e.target.value)}
                           />
                        </div>
                        <div className="col-span-3">
                           <input 
                             type="number" step="0.01"
                             className="w-full p-1.5 bg-transparent border-b border-transparent focus:border-indigo-500 rounded-none text-sm text-right outline-none text-slate-900 dark:text-slate-200 font-mono placeholder:text-slate-200"
                             placeholder="0.00"
                             value={entry.credit}
                             onChange={(e) => handleProEntryChange(idx, 'credit', e.target.value)}
                           />
                        </div>
                     </div>
                   ))}
                 </div>
                 
                 <button type="button" onClick={addProRow} className="mt-4 mx-auto text-xs text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1 transition-colors">
                   <Plus size={14} /> {t('record.add_entry')}
                 </button>
              </div>

              {/* Footer: Balance Bar */}
              <div className={`p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center transition-colors duration-300 ${isBalanced ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-rose-50/50 dark:bg-rose-900/10'}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 text-sm font-bold ${isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                     {isBalanced ? <CheckCircle2 size={20} /> : <AlertOctagon size={20} />}
                     <span>{isBalanced ? t('record.balanced') : t('record.unbalanced')}</span>
                  </div>
                  {!isBalanced && (
                    <span className="text-xs font-mono bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-2 py-1 rounded">
                      {t('record.diff')}: {difference.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex gap-6 text-sm font-mono font-medium">
                  <span className="text-slate-500">{t('record.table_debit')}: <span className="text-slate-900 dark:text-white">{totalDebit.toFixed(2)}</span></span>
                  <span className="text-slate-500">{t('record.table_credit')}: <span className="text-slate-900 dark:text-white">{totalCredit.toFixed(2)}</span></span>
                </div>

                <button 
                  type="submit" 
                  disabled={!isBalanced}
                  className="px-8 py-2.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('record.save_btn')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Record;
