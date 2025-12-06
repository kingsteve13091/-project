
import React, { useState } from 'react';
import { Plus, Search, Filter, Briefcase, User } from 'lucide-react';
import { SEED_TRANSACTIONS } from '../services/mockData';
import { Transaction, TransactionType } from '../types';

// Local type for context to avoid conflict with Accounting 'AccountType'
type BookkeepingAccountContext = 'company' | 'personal';

const TransactionBadge = ({ type }: { type: TransactionType }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
    type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
  }`}>
    {type.charAt(0).toUpperCase() + type.slice(1)}
  </span>
);

const AccountBadge = ({ type }: { type: BookkeepingAccountContext }) => (
  <span className={`flex items-center gap-1 text-xs font-medium ${
    type === 'company' ? 'text-indigo-600' : 'text-purple-600'
  }`}>
    {type === 'company' ? <Briefcase size={12} /> : <User size={12} />}
    {type === 'company' ? 'Biz' : 'Personal'}
  </span>
);

const Bookkeeping = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [transactions, setTransactions] = useState(SEED_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as TransactionType,
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    accountType: 'company' as BookkeepingAccountContext
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      amount: Number(formData.amount),
      type: formData.type,
      category: formData.category,
      date: formData.date,
      description: formData.description,
      accountType: formData.accountType
    };
    setTransactions([newTx, ...transactions]);
    setActiveTab('list');
    setFormData({ ...formData, amount: '', description: '', category: '' });
  };

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Bookkeeping</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg self-start">
          <button 
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ledger
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'add' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            New Entry
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Filter size={18} />
              Filter
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Account</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{tx.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{tx.description}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-xs text-slate-600">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <AccountBadge type={tx.accountType || 'company'} />
                    </td>
                    <td className="px-6 py-4">
                      <TransactionBadge type={tx.type} />
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Plus className="bg-primary text-white rounded-full p-1" size={24} />
            Add New Transaction
          </h2>
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.type === 'income' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.type === 'expense' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Expense
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Account Context</label>
                 <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accountType: 'company' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.accountType === 'company' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accountType: 'personal' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.accountType === 'personal' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Personal
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full pl-8 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
              >
                <option value="">Select a category</option>
                {formData.type === 'income' ? (
                  <>
                    <option value="Tuition Fees">Tuition Fees</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Grants">Grants</option>
                  </>
                ) : (
                  <>
                    <option value="Rent">Rent</option>
                    <option value="Salaries">Salaries</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Supplies">Supplies</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                placeholder="Details about this transaction..."
              />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setActiveTab('list')}
                className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-200"
              >
                Save Transaction
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Bookkeeping;
