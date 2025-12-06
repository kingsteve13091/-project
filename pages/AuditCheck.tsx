
import React from 'react';
import { useFinanceData } from '../services/storage';
import { AuditRuleResult } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';

const AuditCheck = () => {
  const { data, t } = useFinanceData();
  const [results, setResults] = React.useState<AuditRuleResult[]>([]);

  React.useEffect(() => {
    runAuditRules();
  }, [data, data.settings.language]); // Re-run when language changes

  const runAuditRules = () => {
    const findings: AuditRuleResult[] = [];

    // Rule 1: Check for duplicate payments
    const txMap = new Map();
    data.vouchers.forEach(v => {
       const amount = v.entries.reduce((s, e) => s + e.debit, 0);
       const key = `${v.date}-${amount}`;
       if (txMap.has(key)) {
         findings.push({
           id: crypto.randomUUID(),
           severity: 'medium',
           ruleName: t('audit.rule_duplicate'),
           description: t('audit.rule_duplicate_desc').replace('{date}', v.date).replace('{amount}', amount.toString()),
           suggestion: t('audit.rule_duplicate_sugg'),
           relatedVoucherId: v.id
         });
       }
       txMap.set(key, true);
    });

    // Rule 2: Large Round Numbers
    data.vouchers.forEach(v => {
      v.entries.forEach(e => {
        if (e.debit > 5000 && e.debit % 1000 === 0) {
          findings.push({
             id: crypto.randomUUID(),
             severity: 'low',
             ruleName: t('audit.rule_round'),
             description: t('audit.rule_round_desc').replace('{voucher}', v.voucherNumber).replace('{amount}', e.debit.toString()),
             suggestion: t('audit.rule_round_sugg'),
             relatedVoucherId: v.id
          });
        }
      });
    });

    // Rule 3: Weekend entries
    data.vouchers.forEach(v => {
       const day = new Date(v.date).getDay();
       if (day === 0 || day === 6) {
          findings.push({
             id: crypto.randomUUID(),
             severity: 'low',
             ruleName: t('audit.rule_weekend'),
             description: t('audit.rule_weekend_desc').replace('{voucher}', v.voucherNumber),
             suggestion: t('audit.rule_weekend_sugg'),
             relatedVoucherId: v.id
          });
       }
    });

    setResults(findings);
  };

  const getSeverityLabel = (severity: 'high' | 'medium' | 'low') => {
      switch(severity) {
          case 'high': return t('audit.risk_high');
          case 'medium': return t('audit.risk_medium');
          case 'low': return t('audit.risk_low');
          default: return severity;
      }
  };

  return (
    <div className="space-y-6">
       <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-md">
         <div className="flex items-center gap-4">
           <ShieldAlert size={40} className="text-indigo-200" />
           <div>
             <h1 className="text-2xl font-bold">{t('audit.title_check')}</h1>
             <p className="text-indigo-100">{t('audit.scan_result').replace('{count}', data.vouchers.length.toString()).replace('{risks}', results.length.toString())}</p>
           </div>
         </div>
       </div>

       <div className="grid gap-4">
         {results.length === 0 ? (
           <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
             <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">{t('audit.no_issues')}</h3>
             <p className="text-emerald-600 dark:text-emerald-500">{t('audit.no_issues_desc')}</p>
           </div>
         ) : (
           results.map(r => (
             <div key={r.id} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-4">
                <div className={`mt-1 p-2 rounded-lg h-fit ${
                  r.severity === 'high' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 
                  r.severity === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        r.severity === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 
                        r.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{getSeverityLabel(r.severity)}</span>
                      <h3 className="font-bold text-slate-900 dark:text-white">{r.ruleName}</h3>
                   </div>
                   <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">{r.description}</p>
                   <p className="text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-900/50 p-2 rounded">💡 {t('audit.suggestion')}：{r.suggestion}</p>
                </div>
             </div>
           ))
         )}
       </div>
    </div>
  );
};

export default AuditCheck;
