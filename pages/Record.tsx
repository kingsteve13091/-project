
import React, { useState } from 'react';
import { useFinanceData } from '../services/storage';
import { Save, Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Record = () => {
  const { data, addVoucher } = useFinanceData();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense', // expense | income
    category: '', 
    date: new Date().toISOString().slice(0, 10),
    description: '',
    paymentMethod: 'bank' // cash | bank
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    const amount = Number(formData.amount);
    const entries = [];

    const paymentAccId = formData.paymentMethod === 'cash' 
      ? findAccountId('库存现金') 
      : findAccountId('银行存款');

    if (!paymentAccId) return alert('System Error: Cash/Bank account not found.');

    const businessAccId = smartMapCategoryToAccount(formData.category, formData.type);

    if (!businessAccId) return alert('System Error: Category mapping failed.');

    if (formData.type === 'expense') {
      entries.push({ accountId: businessAccId, debit: amount, credit: 0 });
      entries.push({ accountId: paymentAccId, debit: 0, credit: amount });

    } else {
      entries.push({ accountId: paymentAccId, debit: amount, credit: 0 });
      entries.push({ accountId: businessAccId, debit: 0, credit: amount });
    }

    addVoucher({
      date: formData.date,
      description: formData.description || `${formData.category} - ${formData.type === 'expense' ? 'Expense' : 'Income'}`,
      entries,
      status: 'draft',
      createdBy: 'SmartForm',
      attachments: []
    });

    alert('Voucher generated successfully! Check "Vouchers" page.');
    setFormData({ ...formData, amount: '', description: '' });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Smart Record</h1>
        <p className="text-slate-500 dark:text-slate-400">Fill the simple form below. We'll handle the double-entry accounting.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Transaction Type</label>
               <div className="flex bg-slate-50 dark:bg-slate-700 p-1.5 rounded-xl border border-slate-100 dark:border-slate-600">
                 <button type="button" onClick={()=>setFormData({...formData, type: 'income', category: ''})} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${formData.type === 'income' ? 'bg-white dark:bg-slate-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Income</button>
                 <button type="button" onClick={()=>setFormData({...formData, type: 'expense', category: ''})} className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${formData.type === 'expense' ? 'bg-white dark:bg-slate-600 shadow text-rose-600 dark:text-rose-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Expense</button>
               </div>
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</label>
               <input 
                 type="date" 
                 className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                 value={formData.date}
                 onChange={e => setFormData({...formData, date: e.target.value})}
               />
             </div>
          </div>

          {/* Main Amount */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-medium text-slate-400">¥</span>
              <input 
                type="number" 
                step="0.01"
                className="w-full pl-12 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-3xl font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="0.00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Payment Method</label>
               <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none appearance-none"
                value={formData.paymentMethod}
                onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
              >
                <option value="bank">Bank Transfer (银行存款)</option>
                <option value="cash">Cash (库存现金)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</label>
                <button type="button" onClick={() => navigate('/settings')} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 uppercase tracking-wide">
                  + Add New
                </button>
              </div>
              <select 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none appearance-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select Category...</option>
                {formData.type === 'expense' ? (
                  data.settings.expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                ) : (
                  data.settings.incomeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                )}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description (Memo)</label>
            <textarea 
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none resize-none"
              rows={3}
              placeholder="e.g. Monthly office rent payment for October"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200 dark:hover:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group">
            Generate Voucher <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Record;
