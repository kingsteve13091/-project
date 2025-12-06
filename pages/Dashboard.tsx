
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useFinanceData } from '../services/storage';
import { AccountType } from '../types';

const StatCard = ({ title, value, trend, trendUp, icon: Icon }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
        <Icon size={20} />
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const { data, getTrialBalance } = useFinanceData();
  const balances = getTrialBalance();

  const getNetTypeBalance = (type: AccountType) => {
    let total = 0;
    data.accounts.filter(a => a.type === type).forEach(acc => {
      // Trial Balance logic: Debit +, Credit -.
      const val = balances[acc.id] || 0;
      if (type === AccountType.ASSET || type === AccountType.EXPENSE) total += val;
      else total += -val; // Revenue/Liab/Equity are Credit nature
    });
    return total;
  };

  const revenue = getNetTypeBalance(AccountType.REVENUE);
  const expense = getNetTypeBalance(AccountType.EXPENSE);
  const profit = revenue - expense;
  const assets = getNetTypeBalance(AccountType.ASSET);

  // Mock Chart Data derived from Vouchers
  const chartData = data.vouchers.slice(0, 10).reverse().map(v => ({
    name: v.date.slice(5),
    amount: v.entries[0].debit // Simplified for visuals
  }));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Financial performance at a glance</p>
        </div>
        <div className="flex gap-2">
           <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-800">
             <ShieldCheck size={14} /> System Healthy
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Assets" value={`¥${assets.toLocaleString()}`} icon={Wallet} trend="12%" trendUp={true} />
        <StatCard title="Total Revenue" value={`¥${revenue.toLocaleString()}`} icon={TrendingUp} trend="8%" trendUp={true} />
        <StatCard title="Total Expenses" value={`¥${expense.toLocaleString()}`} icon={TrendingDown} trend="3%" trendUp={false} />
        <StatCard title="Net Profit" value={`¥${profit.toLocaleString()}`} icon={Wallet} trend="24%" trendUp={profit >= 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
             <h3 className="font-bold text-slate-800 dark:text-white">Cash Flow Trend</h3>
             <select className="text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 outline-none text-slate-600 dark:text-slate-300">
                <option>Last 30 Days</option>
                <option>This Year</option>
             </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: '#1e293b', color: '#fff' }} 
                  cursor={{stroke: '#e2e8f0', strokeWidth: 1}}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
           <h3 className="font-bold text-slate-800 dark:text-white mb-6">Action Items</h3>
           <ul className="space-y-4 flex-1">
             <li className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
               <div className="w-2 h-2 mt-2 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-900/30"></div>
               <div>
                 <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Review 3 Draft Vouchers</p>
                 <p className="text-xs text-slate-400 mt-1">Pending approval from yesterday</p>
               </div>
             </li>
             <li className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
               <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900/30"></div>
               <div>
                 <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Confirm Depreciation</p>
                 <p className="text-xs text-slate-400 mt-1">Monthly asset run required</p>
               </div>
             </li>
             <li className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
               <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/30"></div>
               <div>
                 <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Tax Report Ready</p>
                 <p className="text-xs text-slate-400 mt-1">Q3 estimated tax generated</p>
               </div>
             </li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
