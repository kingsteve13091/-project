import React from 'react';
import { AlertTriangle, CheckCircle, Clock, ChevronRight, X, ShieldCheck } from 'lucide-react';
import { useFinanceData } from '../services/storage';
import { AuditAlert } from '../types';

interface AlertCardProps {
  alert: AuditAlert;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  const severityColor = {
    high: 'border-l-rose-500 bg-rose-50/50',
    medium: 'border-l-amber-500 bg-amber-50/50',
    low: 'border-l-emerald-500 bg-emerald-50/50'
  };

  const badgeColor = {
    high: 'text-rose-600 bg-rose-100',
    medium: 'text-amber-600 bg-amber-100',
    low: 'text-emerald-600 bg-emerald-100'
  };

  const severityText = {
     high: '高风险',
     medium: '中风险',
     low: '低风险'
  };

  return (
    <div className={`p-5 bg-white rounded-lg shadow-sm border border-slate-200 border-l-4 ${severityColor[alert.severity]}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide ${badgeColor[alert.severity]}`}>
          {severityText[alert.severity]}
        </span>
        <span className="text-xs text-slate-400">{alert.date}</span>
      </div>
      <h3 className="font-bold text-slate-800 mb-1">{alert.title}</h3>
      <p className="text-sm text-slate-500">{alert.description}</p>
    </div>
  );
};

const Audit = () => {
  const { data } = useFinanceData();
  const alerts: AuditAlert[] = [];

  // Logic: Check for Expense Spikes
  // Compare current month expense vs average of previous 2 months
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const getMonthlyExpense = (offset: number) => {
    const d = new Date();
    d.setMonth(currentMonth - offset);
    return data.transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear() && t.type === 'expense';
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const currExp = getMonthlyExpense(0);
  const prevExp1 = getMonthlyExpense(1);
  const prevExp2 = getMonthlyExpense(2);
  const avgPrev = (prevExp1 + prevExp2) / 2;

  if (avgPrev > 0 && currExp > avgPrev * 1.5) {
    alerts.push({
      id: 'auto-1',
      severity: 'high',
      title: '支出激增异常',
      description: `本月支出 (¥${currExp}) 比过去两个月平均值 (¥${avgPrev}) 高出 50% 以上。`,
      date: now.toISOString().split('T')[0],
      type: 'spike'
    });
  }

  // Logic: Check for Negative Cashflow
  const currInc = data.transactions
    .filter(t => {
       const txDate = new Date(t.date);
       return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear && t.type === 'income';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  if (currInc < currExp && currExp > 0) {
     alerts.push({
      id: 'auto-2',
      severity: 'medium',
      title: '现金流警告',
      description: `本月支出 (¥${currExp}) 已超过本月收入 (¥${currInc})。`,
      date: now.toISOString().split('T')[0],
      type: 'cashflow'
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-xl">
           <ShieldCheck size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">财务体检与审计</h1>
          <p className="text-slate-500">基于本地财务数据的自动风险分析</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alerts.length > 0 ? (
          alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
        ) : (
          <div className="col-span-full bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-emerald-800">未发现异常</h3>
            <p className="text-emerald-600">根据当前记录，您的财务状况良好。</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-slate-800 mb-4">手动核查清单</h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 hover:bg-slate-50 border-b border-slate-50 flex justify-between items-center cursor-pointer">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-amber-400"></div>
               <span className="text-sm font-medium text-slate-700">核查大于 ¥500 的支出票据</span>
             </div>
             <ChevronRight size={16} className="text-slate-400" />
          </div>
          <div className="p-4 hover:bg-slate-50 flex justify-between items-center cursor-pointer">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-slate-300"></div>
               <span className="text-sm font-medium text-slate-700">月度银行流水对账</span>
             </div>
             <ChevronRight size={16} className="text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audit;