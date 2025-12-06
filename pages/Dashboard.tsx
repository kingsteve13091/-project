
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ShieldCheck, ArrowUpRight, ArrowDownRight, Plus, FileText, Search, Zap, Activity, Users, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';
import { useFinanceData } from '../services/storage';
import { AccountType } from '../types';
import { useNavigate } from 'react-router-dom';

const QuickAction = ({ icon: Icon, label, desc, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-start p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group w-full text-left"
  >
    <div className={`p-2.5 rounded-lg ${color} text-white shadow-sm mb-3 group-hover:scale-105 transition-transform`}>
      <Icon size={18} />
    </div>
    <span className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{label}</span>
    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{desc}</span>
  </button>
);

const StatCard = ({ title, value, trend, trendUp, icon: Icon, gradient }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full transition-transform group-hover:scale-110`}></div>
    
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-10 text-slate-700 dark:text-white`}>
          <Icon size={20} className="dark:text-white text-slate-800" />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full border ${trendUp ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400' : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400'}`}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-mono">{value}</h3>
      </div>
    </div>
  </div>
);

// Advanced Health Score Component
const FinancialHealthCard = ({ score, profit, revenue, assets, currency }: any) => {
  const { t } = useFinanceData();
  const circumference = 2 * Math.PI * 36; // r=36
  const offset = circumference - (score / 100) * circumference;
  
  // Determine Grade & Color
  let grade = 'C';
  let color = 'stroke-rose-500';
  let textCol = 'text-rose-600';
  let bgCol = 'bg-rose-50 dark:bg-rose-900/20';
  let statusText = 'Need Attention';

  if (score >= 80) {
    grade = 'A'; color = 'stroke-emerald-500'; textCol = 'text-emerald-600'; bgCol = 'bg-emerald-50 dark:bg-emerald-900/20'; statusText = 'Excellent';
  } else if (score >= 60) {
    grade = 'B'; color = 'stroke-indigo-500'; textCol = 'text-indigo-600'; bgCol = 'bg-indigo-50 dark:bg-indigo-900/20'; statusText = 'Good';
  }

  // Sub-metrics calculation (Mock logic for display)
  const liquidityStatus = assets > 0 ? 'Healthy' : 'Low';
  const profitStatus = profit > 0 ? 'Profitable' : 'Loss';
  const growthStatus = revenue > 0 ? 'Stable' : 'No Data';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 pr-6">
      {/* Ring Chart */}
      <div className="relative flex items-center justify-center w-24 h-24 flex-shrink-0">
         <svg className="transform -rotate-90 w-full h-full">
           <circle cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-slate-700" />
           <circle 
             cx="48" cy="48" r="36" stroke="currentColor" strokeWidth="6" fill="transparent" 
             strokeDasharray={circumference} 
             strokeDashoffset={offset} 
             strokeLinecap="round"
             className={`${color} transition-all duration-1000 ease-out`} 
           />
         </svg>
         <div className="absolute flex flex-col items-center">
           <span className={`text-2xl font-bold ${textCol}`}>{score}</span>
           <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
         </div>
      </div>

      {/* Details */}
      <div className="flex-1 py-3">
        <div className="flex justify-between items-start mb-2">
           <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('dashboard.health_score')}</p>
             <h3 className={`font-bold text-sm ${textCol}`}>{statusText} ({grade})</h3>
           </div>
           <button className="text-slate-300 hover:text-indigo-500 transition-colors"><HelpCircle size={14} /></button>
        </div>
        
        {/* Micro Indicators */}
        <div className="flex gap-2 mt-1">
          <div className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${profit > 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
            {profit > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {profit > 0 ? '盈利' : '亏损'}
          </div>
          <div className="px-2 py-1 rounded bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
            现金流: {liquidityStatus === 'Healthy' ? '充足' : '紧张'}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { data, getTrialBalance, t } = useFinanceData();
  const navigate = useNavigate();
  const balances = getTrialBalance();

  const getNetTypeBalance = (type: AccountType) => {
    let total = 0;
    data.accounts.filter(a => a.type === type).forEach(acc => {
      const val = balances[acc.id] || 0;
      if (type === AccountType.ASSET || type === AccountType.EXPENSE) total += val;
      else total += -val;
    });
    return total;
  };

  const revenue = getNetTypeBalance(AccountType.REVENUE);
  const expense = getNetTypeBalance(AccountType.EXPENSE);
  const profit = revenue - expense;
  const assets = getNetTypeBalance(AccountType.ASSET);
  const currency = data.settings.currency;

  // Advanced Health Score Algorithm
  let healthScore = 50; // Base score
  
  // 1. Profitability (Max 30)
  if (profit > 0) healthScore += 20;
  else if (profit === 0) healthScore += 10;

  // 2. Margin (Max 20)
  if (revenue > 0 && (profit / revenue) > 0.2) healthScore += 20;
  else if (revenue > 0 && (profit / revenue) > 0.1) healthScore += 10;

  // 3. Liquidity/Assets (Max 20)
  if (assets > 0) healthScore += 20;

  // 4. Activity (Max 10)
  if (data.vouchers.length > 5) healthScore += 10;

  healthScore = Math.min(100, healthScore);

  const chartData = data.vouchers.slice(0, 10).reverse().map(v => ({
    name: v.date.slice(5),
    amount: v.entries.reduce((sum, e) => sum + e.debit, 0)
  }));

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.morning');
    if (hour < 18) return t('dashboard.afternoon');
    return t('dashboard.evening');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
             {getTimeGreeting()}，<span className="text-indigo-600 dark:text-indigo-400">{data.settings.companyName}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
            {t('dashboard.subtitle')}
          </p>
        </div>
        
        {/* New Financial Health Card positioned prominently */}
        <div className="w-full xl:w-auto min-w-[320px]">
           <FinancialHealthCard 
             score={healthScore} 
             profit={profit} 
             revenue={revenue} 
             assets={assets}
             currency={currency} 
           />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dashboard.total_assets')} value={`${currency}${assets.toLocaleString()}`} icon={Wallet} trend="12%" trendUp={true} gradient="from-blue-400 to-blue-600" />
        <StatCard title={t('dashboard.total_revenue')} value={`${currency}${revenue.toLocaleString()}`} icon={TrendingUp} trend="8%" trendUp={true} gradient="from-emerald-400 to-emerald-600" />
        <StatCard title={t('dashboard.total_expense')} value={`${currency}${expense.toLocaleString()}`} icon={TrendingDown} trend="3%" trendUp={false} gradient="from-rose-400 to-rose-600" />
        <StatCard title={t('dashboard.net_profit')} value={`${currency}${profit.toLocaleString()}`} icon={Wallet} trend="24%" trendUp={profit >= 0} gradient="from-indigo-400 to-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Chart & Actions */}
        <div className="lg:col-span-2 space-y-8">
           {/* Quick Actions Grid */}
           <div>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">{t('dashboard.quick_actions')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <QuickAction icon={Plus} label={t('dashboard.action_record')} desc={t('dashboard.action_record_desc')} color="bg-indigo-600" onClick={() => navigate('/record')} />
                <QuickAction icon={FileText} label={t('dashboard.action_audit')} desc={t('dashboard.action_audit_desc')} color="bg-amber-500" onClick={() => navigate('/vouchers')} />
                <QuickAction icon={Search} label={t('dashboard.action_search')} desc={t('dashboard.action_search_desc')} color="bg-emerald-500" onClick={() => navigate('/records')} />
                <QuickAction icon={Zap} label={t('dashboard.action_ai')} desc={t('dashboard.action_ai_desc')} color="bg-purple-600" onClick={() => navigate('/ai')} />
              </div>
           </div>

           {/* Chart */}
           <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t('dashboard.chart_title')}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t('dashboard.chart_subtitle')}</p>
                </div>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontFamily: 'JetBrains Mono'}} 
                      dy={15} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12, fontFamily: 'JetBrains Mono'}} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                        backgroundColor: '#1e293b', 
                        color: '#fff',
                        fontFamily: 'JetBrains Mono'
                      }} 
                      cursor={{stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4'}}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fill="url(#colorVal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Right Sidebar - Todos */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full">
           <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
             <ShieldCheck className="text-emerald-500" size={20} />
             {t('dashboard.todos')}
           </h3>
           <ul className="space-y-4 flex-1">
             <li onClick={() => navigate('/vouchers')} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer group border border-slate-100 dark:border-slate-700/50">
               <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-900/30"></div>
               <div>
                 <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('dashboard.todo_review')}</p>
                 <p className="text-xs text-slate-400 mt-1">{t('dashboard.todo_review_desc')}</p>
               </div>
             </li>
             <li onClick={() => navigate('/assets')} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer group border border-slate-100 dark:border-slate-700/50">
               <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-900/30"></div>
               <div>
                 <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('dashboard.todo_depreciation')}</p>
                 <p className="text-xs text-slate-400 mt-1">{t('dashboard.todo_depreciation_desc')}</p>
               </div>
             </li>
             <li className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer group border border-slate-100 dark:border-slate-700/50">
               <div className="w-2.5 h-2.5 mt-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/30"></div>
               <div>
                 <p className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('dashboard.todo_tax')}</p>
                 <p className="text-xs text-slate-400 mt-1">{t('dashboard.todo_tax_desc')}</p>
               </div>
             </li>
           </ul>
           <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl">
                 <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                   <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">{t('dashboard.team')}</p>
                   <p className="text-[10px] text-indigo-700/70 dark:text-indigo-400/70">{t('dashboard.team_desc')}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
