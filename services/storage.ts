
import { useState, useEffect } from 'react';
import { FinanceData, Voucher, Account, AuditLog, AppSettings, FixedAsset, AccountType, BalanceItem, AuditChange } from '../types';
import { DEFAULT_ACCOUNTS, SEED_VOUCHERS, SEED_ASSETS, CURRENT_USER } from './mockData';
import { translations } from './translations';

const STORAGE_KEY = 'finance_manager_enterprise_v3'; // Upgraded version for clean slate

const INITIAL_DATA: FinanceData = {
  accounts: DEFAULT_ACCOUNTS,
  vouchers: SEED_VOUCHERS,
  fixedAssets: SEED_ASSETS,
  auditLogs: [],
  settings: {
    companyName: 'TechEdu Corp',
    currency: '¥',
    lockDate: '',
    theme: 'light',
    language: 'zh', // Default language
    incomeCategories: ['学费收入', '咨询服务', '政府补助', '利息收入'],
    expenseCategories: ['房租物业', '水电费', '工资薪金', '市场推广', '办公用品', '差旅费']
  },
  assets: [{id: '1', name: '库存现金', amount: 50000, type: 'asset'}],
  liabilities: [{id: '2', name: '信用卡欠款', amount: 2000, type: 'liability'}]
};

export const getStorageData = (): FinanceData => {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return INITIAL_DATA;
    
    // Merge with INITIAL_DATA to ensure new fields
    const parsed = JSON.parse(item);
    return {
        ...INITIAL_DATA,
        ...parsed,
        settings: { ...INITIAL_DATA.settings, ...parsed.settings }
    };
  } catch (error) {
    return INITIAL_DATA;
  }
};

export const setStorageData = (data: FinanceData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('finance-data-update'));
};

export const useFinanceData = () => {
  const [data, setData] = useState<FinanceData>(getStorageData());

  useEffect(() => {
    const handleStorageChange = () => setData(getStorageData());
    window.addEventListener('finance-data-update', handleStorageChange);
    return () => window.removeEventListener('finance-data-update', handleStorageChange);
  }, []);

  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  // Translation Helper
  const t = (key: string): string => {
    const lang = data.settings.language || 'zh';
    const keys = key.split('.');
    let value: any = translations[lang];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key; // Return key if translation missing
      }
    }
    return value;
  };

  const logAction = (
    currentData: FinanceData, 
    action: AuditLog['action'], 
    entity: AuditLog['entity'], 
    details: string,
    changes?: AuditChange[],
    entityId?: string
  ) => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      action,
      entity,
      entityId,
      details,
      changes
    };
    currentData.auditLogs.unshift(newLog);
    return currentData;
  };

  // --- Core Accountant Functions ---

  const addVoucher = (voucher: Omit<Voucher, 'id' | 'voucherNumber'>) => {
    let newData = { ...data };
    
    // Check Lock Date
    if (newData.settings.lockDate && voucher.date <= newData.settings.lockDate) {
      alert(`无法在锁定日期 (${newData.settings.lockDate}) 之前添加凭证。`);
      return;
    }

    // Verify Balance
    const totalDebit = voucher.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = voucher.entries.reduce((sum, e) => sum + e.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`凭证借贷不平！借: ${totalDebit}, 贷: ${totalCredit}`);
      return;
    }

    const newId = crypto.randomUUID();
    const dateStr = voucher.date.replace(/-/g, '');
    const count = newData.vouchers.filter(v => v.date === voucher.date).length + 1;
    const voucherNumber = `V-${dateStr}-${count.toString().padStart(3, '0')}`;

    const newVoucher: Voucher = { ...voucher, id: newId, voucherNumber, createdBy: CURRENT_USER.name };
    newData.vouchers = [newVoucher, ...newData.vouchers];
    
    const changes: AuditChange[] = [
      { field: 'voucherNumber', oldValue: null, newValue: voucherNumber },
      { field: 'amount', oldValue: null, newValue: totalDebit }
    ];

    newData = logAction(newData, 'create', 'voucher', `创建凭证 ${voucherNumber}: ${voucher.description}`, changes, newId);
    setStorageData(newData);
  };

  const updateVoucherStatus = (id: string, status: Voucher['status']) => {
    let newData = { ...data };
    const voucher = newData.vouchers.find(v => v.id === id);
    
    if (voucher) {
      const oldStatus = voucher.status;
      newData.vouchers = newData.vouchers.map(v => v.id === id ? { ...v, status } : v);
      
      const changes: AuditChange[] = [
        { field: 'status', oldValue: oldStatus, newValue: status }
      ];
      
      newData = logAction(newData, 'approve', 'voucher', `更新凭证 ${voucher.voucherNumber} 状态为 ${status}`, changes, id);
      setStorageData(newData);
    }
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    let newData = { ...data };
    const newId = crypto.randomUUID();
    newData.accounts.push({ ...account, id: newId });
    
    const changes: AuditChange[] = [
       { field: 'code', oldValue: null, newValue: account.code },
       { field: 'name', oldValue: null, newValue: account.name }
    ];

    newData = logAction(newData, 'create', 'account', `新增科目 ${account.name}`, changes, newId);
    setStorageData(newData);
  };

  const addAsset = (asset: Omit<FixedAsset, 'id'>) => {
    let newData = { ...data };
    const newId = crypto.randomUUID();
    newData.fixedAssets.push({ ...asset, id: newId });
    
    const changes: AuditChange[] = [
      { field: 'name', oldValue: null, newValue: asset.name },
      { field: 'originalValue', oldValue: null, newValue: asset.originalValue }
    ];

    newData = logAction(newData, 'create', 'asset', `新增固定资产 ${asset.name}`, changes, newId);
    setStorageData(newData);
  };

  const runDepreciation = () => {
    let newData = { ...data };
    
    // Check if depreciation already ran this month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const existing = newData.vouchers.find(v => v.voucherNumber.startsWith(`SYS-DEP-${currentMonth}`));
    if (existing) {
        alert('本月折旧已计提，请勿重复操作！');
        return;
    }

    const depreciationVoucherEntries: any[] = [];
    let totalDep = 0;

    newData.fixedAssets = newData.fixedAssets.map(asset => {
      // Straight line: (Cost - Salvage) / LifeYears / 12
      const monthlyDep = (asset.originalValue - asset.salvageValue) / (asset.lifeYears * 12);
      if (asset.accumulatedDepreciation + monthlyDep <= asset.originalValue - asset.salvageValue) {
        totalDep += monthlyDep;
        return { ...asset, accumulatedDepreciation: asset.accumulatedDepreciation + monthlyDep };
      }
      return asset;
    });

    if (totalDep > 0) {
      const depExpId = newData.accounts.find(a => a.name === '管理费用')?.id || '';
      const accDepId = newData.accounts.find(a => a.name === '累计折旧')?.id || '';

      if (depExpId && accDepId) {
        const voucher: Voucher = {
          id: crypto.randomUUID(),
          voucherNumber: `SYS-DEP-${new Date().toISOString().slice(0,10)}`,
          date: new Date().toISOString().slice(0, 10),
          description: '系统自动计提本月折旧',
          status: 'posted',
          createdBy: 'SYSTEM',
          entries: [
            { accountId: depExpId, debit: totalDep, credit: 0 },
            { accountId: accDepId, debit: 0, credit: totalDep }
          ]
        };
        newData.vouchers.unshift(voucher);
        newData = logAction(newData, 'create', 'voucher', `自动生成折旧凭证 ¥${totalDep.toFixed(2)}`);
      }
    }
    setStorageData(newData);
    alert(`本月折旧计提完成，共计 ¥${totalDep.toFixed(2)}`);
  };

  const setLockDate = (date: string) => {
    let newData = { ...data };
    const oldDate = newData.settings.lockDate;
    newData.settings.lockDate = date;
    
    const changes: AuditChange[] = [
      { field: 'lockDate', oldValue: oldDate, newValue: date }
    ];

    newData = logAction(newData, 'update', 'settings', `账期锁定至 ${date}`, changes);
    setStorageData(newData);
  };

  // --- Manual Balance Item Functions ---

  const addBalanceItem = (item: Omit<BalanceItem, 'id'>) => {
    let newData = { ...data };
    const newItem = { ...item, id: crypto.randomUUID() };
    if (item.type === 'asset') newData.assets.push(newItem);
    else newData.liabilities.push(newItem);
    newData = logAction(newData, 'create', 'asset', `Added simple balance item: ${item.name}`, [], newItem.id);
    setStorageData(newData);
  };

  const deleteBalanceItem = (id: string, type: 'asset' | 'liability') => {
      let newData = { ...data };
      if (type === 'asset') newData.assets = newData.assets.filter(a => a.id !== id);
      else newData.liabilities = newData.liabilities.filter(l => l.id !== id);
      newData = logAction(newData, 'delete', 'asset', `Deleted simple balance item ${id}`, [], id);
      setStorageData(newData);
  };

  // --- Settings Functions ---

  const updateSettings = (settings: Partial<AppSettings>) => {
    let newData = { ...data };
    const changes: AuditChange[] = [];

    (Object.keys(settings) as Array<keyof AppSettings>).forEach(key => {
       const oldValue = newData.settings[key];
       const newValue = settings[key];
       if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
           changes.push({ field: key, oldValue, newValue });
       }
    });

    newData.settings = { ...newData.settings, ...settings };
    newData = logAction(newData, 'update', 'settings', '更新系统设置', changes);
    setStorageData(newData);
  };

  const toggleTheme = () => {
    let newData = { ...data };
    newData.settings.theme = newData.settings.theme === 'light' ? 'dark' : 'light';
    setStorageData(newData);
  };

  const toggleLanguage = () => {
    let newData = { ...data };
    newData.settings.language = newData.settings.language === 'zh' ? 'en' : 'zh';
    setStorageData(newData);
  };

  const addCategory = (type: 'income' | 'expense', category: string) => {
    let newData = { ...data };
    if (type === 'income') {
        if(!newData.settings.incomeCategories.includes(category)) {
            newData.settings.incomeCategories.push(category);
        }
    } else {
        if(!newData.settings.expenseCategories.includes(category)) {
            newData.settings.expenseCategories.push(category);
        }
    }
    const changes = [{ field: type === 'income' ? 'incomeCategories' : 'expenseCategories', oldValue: 'List', newValue: `Added ${category}` }];
    newData = logAction(newData, 'update', 'settings', `添加分类: ${category}`, changes);
    setStorageData(newData);
  };

  const removeCategory = (type: 'income' | 'expense', category: string) => {
    let newData = { ...data };
     if (type === 'income') {
        newData.settings.incomeCategories = newData.settings.incomeCategories.filter(c => c !== category);
    } else {
        newData.settings.expenseCategories = newData.settings.expenseCategories.filter(c => c !== category);
    }
    const changes = [{ field: type === 'income' ? 'incomeCategories' : 'expenseCategories', oldValue: 'List', newValue: `Removed ${category}` }];
    newData = logAction(newData, 'update', 'settings', `删除分类: ${category}`, changes);
    setStorageData(newData);
  };

  const importData = (jsonStr: string): boolean => {
    try {
        const imported = JSON.parse(jsonStr);
        if (imported.accounts && imported.vouchers && imported.settings) {
            setStorageData(imported);
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
  };

  const resetData = () => {
    let newData = INITIAL_DATA;
    newData = logAction(newData, 'delete', 'settings', '系统数据重置');
    setStorageData(newData);
    window.location.reload();
  };

  // --- Reporting Helpers ---

  const getTrialBalance = () => {
    const balances: Record<string, number> = {}; 
    data.accounts.forEach(a => balances[a.id] = 0);

    data.vouchers.forEach(v => {
      v.entries.forEach(e => {
        if (balances[e.accountId] !== undefined) {
          balances[e.accountId] += (e.debit - e.credit);
        }
      });
    });
    return balances;
  };

  const getRangeTrialBalance = (startDate: string, endDate: string) => {
    const result: Record<string, { debit: number, credit: number }> = {};
    data.accounts.forEach(a => {
      result[a.id] = { debit: 0, credit: 0 };
    });

    data.vouchers.forEach(v => {
      if (v.date >= startDate && v.date <= endDate) {
        v.entries.forEach(e => {
          if (result[e.accountId]) {
            result[e.accountId].debit += e.debit;
            result[e.accountId].credit += e.credit;
          }
        });
      }
    });
    return result;
  };

  // --- Month-End Closing ---
  
  const previewClosingEntry = (year: number, month: number) => {
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2,'0')}-${lastDay}`;
    
    const rangeBal = getRangeTrialBalance(startDate, endDate);
    
    let totalRevenue = 0;
    let totalExpense = 0;
    const closingEntries: any[] = [];

    data.accounts.filter(a => a.type === AccountType.REVENUE).forEach(acc => {
       const bal = rangeBal[acc.id];
       const netCredit = bal.credit - bal.debit;
       if (netCredit !== 0) {
           totalRevenue += netCredit;
           closingEntries.push({ accountId: acc.id, debit: netCredit, credit: 0 });
       }
    });

    data.accounts.filter(a => a.type === AccountType.EXPENSE).forEach(acc => {
        const bal = rangeBal[acc.id];
        const netDebit = bal.debit - bal.credit;
        if (netDebit !== 0) {
            totalExpense += netDebit;
            closingEntries.push({ accountId: acc.id, debit: 0, credit: netDebit });
        }
    });

    const netProfit = totalRevenue - totalExpense;
    
    const retainedEarningsAcc = data.accounts.find(a => a.code === '4103' || a.name.includes('利润') || a.name.includes('Profit'));
    
    if (retainedEarningsAcc) {
        if (netProfit > 0) {
            closingEntries.push({ accountId: retainedEarningsAcc.id, debit: 0, credit: netProfit });
        } else if (netProfit < 0) {
            closingEntries.push({ accountId: retainedEarningsAcc.id, debit: Math.abs(netProfit), credit: 0 });
        }
    }

    return { totalRevenue, totalExpense, netProfit, closingEntries, endDate };
  };

  const executeClosing = (year: number, month: number) => {
    const preview = previewClosingEntry(year, month);
    if (preview.closingEntries.length === 0) return;

    let newData = { ...data };
    
    const closingVoucher: Voucher = {
        id: crypto.randomUUID(),
        voucherNumber: `SYS-CLOSE-${year}${String(month).padStart(2,'0')}`,
        date: preview.endDate,
        description: `月末结转: ${year}年${month}月`,
        entries: preview.closingEntries,
        status: 'posted',
        createdBy: 'SYSTEM',
        attachments: []
    };
    
    newData.vouchers.unshift(closingVoucher);
    
    const oldDate = newData.settings.lockDate;
    newData.settings.lockDate = preview.endDate;
    
    const changes: AuditChange[] = [
      { field: 'lockDate', oldValue: oldDate, newValue: preview.endDate }
    ];
    
    newData = logAction(newData, 'create', 'voucher', `执行月末结账 ${year}-${month}`, changes, closingVoucher.id);
    setStorageData(newData);
  };

  return {
    data,
    addVoucher,
    updateVoucherStatus,
    addAccount,
    addAsset,
    runDepreciation,
    setLockDate,
    resetSystem: resetData,
    resetData,
    getTrialBalance,
    getRangeTrialBalance,
    addBalanceItem,
    deleteBalanceItem,
    updateSettings,
    toggleTheme,
    toggleLanguage,
    t,
    addCategory,
    removeCategory,
    importData,
    previewClosingEntry,
    executeClosing
  };
};
