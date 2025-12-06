
import React from 'react';
import { useFinanceData } from '../services/storage';
import { History, ArrowRight } from 'lucide-react';

const AuditLogPage = () => {
  const { data } = useFinanceData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <History size={24} className="text-slate-500" />
        <h1 className="text-2xl font-bold text-slate-900">审计轨迹 (Audit Trail)</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
             <tr>
               <th className="px-6 py-4">时间</th>
               <th className="px-6 py-4">操作人</th>
               <th className="px-6 py-4">动作类型</th>
               <th className="px-6 py-4">对象</th>
               <th className="px-6 py-4 w-1/3">详细描述 & 变更</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
             {data.auditLogs.map(log => (
               <tr key={log.id} className="hover:bg-slate-50">
                 <td className="px-6 py-4 text-slate-500 font-mono text-xs align-top">
                   {new Date(log.timestamp).toLocaleString()}
                 </td>
                 <td className="px-6 py-4 font-medium text-slate-900 align-top">{log.userName}</td>
                 <td className="px-6 py-4 align-top">
                   <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                     log.action === 'create' ? 'bg-emerald-100 text-emerald-700' :
                     log.action === 'delete' ? 'bg-rose-100 text-rose-700' :
                     log.action === 'approve' ? 'bg-indigo-100 text-indigo-700' :
                     'bg-blue-100 text-blue-700'
                   }`}>{log.action}</span>
                 </td>
                 <td className="px-6 py-4 text-slate-600 align-top">
                   {log.entity}
                   {log.entityId && <div className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[100px] truncate">{log.entityId}</div>}
                 </td>
                 <td className="px-6 py-4 text-slate-800 align-top">
                   <div className="font-medium mb-1">{log.details}</div>
                   {log.changes && log.changes.length > 0 && (
                     <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs space-y-1">
                       {log.changes.map((change, idx) => (
                         <div key={idx} className="flex items-center gap-2">
                            <span className="font-semibold text-slate-500 min-w-[80px]">{change.field}:</span>
                            <span className="text-slate-500 line-through">{JSON.stringify(change.oldValue) || 'null'}</span>
                            <ArrowRight size={10} className="text-slate-400" />
                            <span className="font-bold text-slate-700">{JSON.stringify(change.newValue)}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </td>
               </tr>
             ))}
             {data.auditLogs.length === 0 && (
               <tr><td colSpan={5} className="p-8 text-center text-slate-400">暂无审计记录</td></tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogPage;
