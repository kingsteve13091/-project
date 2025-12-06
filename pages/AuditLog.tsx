
import React from 'react';
import { useFinanceData } from '../services/storage';
import { History, ArrowRight } from 'lucide-react';

const AuditLogPage = () => {
  const { data, t } = useFinanceData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <History size={24} className="text-slate-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('audit.title_log')}</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
             <tr>
               <th className="px-6 py-4">{t('audit.time')}</th>
               <th className="px-6 py-4">{t('audit.operator')}</th>
               <th className="px-6 py-4">{t('audit.action')}</th>
               <th className="px-6 py-4">{t('audit.entity')}</th>
               <th className="px-6 py-4 w-1/3">{t('audit.details')}</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
             {data.auditLogs.map(log => (
               <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                 <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs align-top">
                   {new Date(log.timestamp).toLocaleString()}
                 </td>
                 <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 align-top">{log.userName}</td>
                 <td className="px-6 py-4 align-top">
                   <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                     log.action === 'create' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                     log.action === 'delete' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                     log.action === 'approve' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                   }`}>{log.action}</span>
                 </td>
                 <td className="px-6 py-4 text-slate-600 dark:text-slate-300 align-top">
                   {log.entity}
                   {log.entityId && <div className="text-[10px] text-slate-400 font-mono mt-0.5 max-w-[100px] truncate">{log.entityId}</div>}
                 </td>
                 <td className="px-6 py-4 text-slate-800 dark:text-slate-200 align-top">
                   <div className="font-medium mb-1">{log.details}</div>
                   {log.changes && log.changes.length > 0 && (
                     <div className="mt-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg p-2 text-xs space-y-1">
                       {log.changes.map((change, idx) => (
                         <div key={idx} className="flex items-center gap-2">
                            <span className="font-semibold text-slate-500 dark:text-slate-400 min-w-[80px]">{change.field}:</span>
                            <span className="text-slate-500 line-through">{JSON.stringify(change.oldValue) || 'null'}</span>
                            <ArrowRight size={10} className="text-slate-400" />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{JSON.stringify(change.newValue)}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </td>
               </tr>
             ))}
             {data.auditLogs.length === 0 && (
               <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('audit.no_logs')}</td></tr>
             )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogPage;
