import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar } from 'lucide-react';
import { useFinanceData } from '../services/storage';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#10b981', '#3b82f6'];

const Analysis = () => {
  const { data } = useFinanceData();
  const handleExport = () => {
    alert("正在导出 PDF 报表...");
  };

  // Process data for charts
  const currentYear = new Date().getFullYear();
  
  // 1. Expense Breakdown by Category
  const expenseByCategory: Record<string, number> = {};
  data.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });
  
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

  // 2. Monthly Trends
  const monthlyData = [];
  for(let i=0; i<12; i++) {
     const monthName = new Date(currentYear, i).toLocaleString('zh-CN', { month: 'short' });
     const monthTxs = data.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === i && d.getFullYear() === currentYear;
     });
     
     const inc = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
     const exp = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
     
     if (inc > 0 || exp > 0) {
        monthlyData.push({ month: monthName, income: inc, expense: exp, profit: inc - exp });
     }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">盈亏分析</h1>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50">
            <Calendar size={16} />
            {currentYear}年
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-600"
          >
            <Download size={16} />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">月度收支趋势</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`¥${value}`, '']} />
                <Legend />
                <Bar dataKey="income" name="收入" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="支出" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="净利润" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">支出分类占比</h3>
          <div className="h-80 flex items-center justify-center">
             {pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} formatter={(value) => `¥${value}`} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
             ) : (
               <div className="text-slate-400">暂无支出数据</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;