import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceData } from '../services/storage';
import { TransactionType, Transaction } from '../types';
import { Search, Trash2, Edit2, Plus, ArrowLeft, ArrowRight } from 'lucide-react';

const TransactionBadge = ({ type }: { type: TransactionType }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
    type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
  }`}>
    {type === 'income' ? '收入' : '支出'}
  </span>
);

const Records = () => {
  const navigate = useNavigate();
  const { data, deleteTransaction } = useFinanceData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // 筛选逻辑
  const filtered = data.transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesDate = !filterDate || t.date === filterDate;
    
    return matchesSearch && matchesType && matchesDate;
  });

  // 按日期降序排序
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 分页逻辑
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleDelete = (id: string) => {
    if(window.confirm('确定要删除这条记录吗？此操作无法撤销。')) {
      deleteTransaction(id);
    }
  };

  const handleEdit = (tx: Transaction) => {
    // 携带当前交易数据跳转到 Record 页面
    navigate('/record', { state: { transaction: tx } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">企业账目明细</h1>
        <button 
          onClick={() => navigate('/record')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:bg-indigo-600 transition-colors"
        >
          <Plus size={16} />
          记一笔
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* 工具栏 */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="搜索备注或分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-900"
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-slate-700 cursor-pointer"
            >
              <option value="all">所有类型</option>
              <option value="income">仅收入</option>
              <option value="expense">仅支出</option>
            </select>
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none text-slate-700 cursor-pointer"
            />
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">日期</th>
                <th className="px-6 py-4 font-medium w-1/3">备注说明</th>
                <th className="px-6 py-4 font-medium">分类</th>
                <th className="px-6 py-4 font-medium">类型</th>
                <th className="px-6 py-4 font-medium text-right">金额</th>
                <th className="px-6 py-4 font-medium text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length > 0 ? (
                paginated.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{tx.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{tx.description}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-xs text-slate-600 border border-slate-200">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <TransactionBadge type={tx.type} />
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-base ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(tx)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="编辑"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    没有找到匹配的记录。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft size={16} />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Records;