
import React from 'react';
import { useFinanceData } from '../services/storage';
import { AuditRuleResult } from '../types';
import { ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';

const AuditCheck = () => {
  const { data } = useFinanceData();
  const [results, setResults] = React.useState<AuditRuleResult[]>([]);

  React.useEffect(() => {
    runAuditRules();
  }, [data]);

  const runAuditRules = () => {
    const findings: AuditRuleResult[] = [];

    // Rule 1: Check for duplicate payments (Same amount, same day)
    const txMap = new Map();
    data.vouchers.forEach(v => {
       const amount = v.entries.reduce((s, e) => s + e.debit, 0);
       const key = `${v.date}-${amount}`;
       if (txMap.has(key)) {
         findings.push({
           id: crypto.randomUUID(),
           severity: 'medium',
           ruleName: '重复付款检测',
           description: `发现日期为 ${v.date} 金额为 ${amount} 的多笔凭证`,
           suggestion: '请核实是否为重复入账。',
           relatedVoucherId: v.id
         });
       }
       txMap.set(key, true);
    });

    // Rule 2: Large Round Numbers (Fraud indicator)
    data.vouchers.forEach(v => {
      v.entries.forEach(e => {
        if (e.debit > 5000 && e.debit % 1000 === 0) {
          findings.push({
             id: crypto.randomUUID(),
             severity: 'low',
             ruleName: '大额整数预警',
             description: `凭证 ${v.voucherNumber} 包含大额整数交易 ${e.debit}`,
             suggestion: '大额整数通常是估算或欺诈的信号，请抽查原始单据。',
             relatedVoucherId: v.id
          });
        }
      });
    });

    // Rule 3: Weekend entries (Internal Control)
    data.vouchers.forEach(v => {
       const day = new Date(v.date).getDay();
       if (day === 0 || day === 6) {
          findings.push({
             id: crypto.randomUUID(),
             severity: 'low',
             ruleName: '非工作日记账',
             description: `凭证 ${v.voucherNumber} 是在周末录入的`,
             suggestion: '确认是否为紧急业务，防止内控失效。',
             relatedVoucherId: v.id
          });
       }
    });

    setResults(findings);
  };

  return (
    <div className="space-y-6">
       <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-md">
         <div className="flex items-center gap-4">
           <ShieldAlert size={40} className="text-indigo-200" />
           <div>
             <h1 className="text-2xl font-bold">智能审计中心</h1>
             <p className="text-indigo-100">系统已自动扫描 {data.vouchers.length} 份凭证，发现 {results.length} 个潜在风险点。</p>
           </div>
         </div>
       </div>

       <div className="grid gap-4">
         {results.length === 0 ? (
           <div className="p-8 text-center bg-white rounded-xl border border-emerald-100">
             <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
             <h3 className="text-lg font-bold text-emerald-800">未发现异常</h3>
             <p className="text-emerald-600">各项内控指标正常。</p>
           </div>
         ) : (
           results.map(r => (
             <div key={r.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                <div className={`mt-1 p-2 rounded-lg h-fit ${
                  r.severity === 'high' ? 'bg-rose-100 text-rose-600' : 
                  r.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        r.severity === 'high' ? 'bg-rose-100 text-rose-700' : 
                        r.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>{r.severity} Risk</span>
                      <h3 className="font-bold text-slate-900">{r.ruleName}</h3>
                   </div>
                   <p className="text-slate-600 text-sm mb-2">{r.description}</p>
                   <p className="text-slate-500 text-xs bg-slate-50 p-2 rounded">💡 建议：{r.suggestion}</p>
                </div>
             </div>
           ))
         )}
       </div>
    </div>
  );
};

export default AuditCheck;
