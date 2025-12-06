
import { useState, useEffect } from 'react';
import { FinanceData, Voucher, Account, AuditLog, AppSettings, FixedAsset, AccountType, BalanceItem, AuditChange } from '../types';
import { DEFAULT_ACCOUNTS, SEED_VOUCHERS, SEED_ASSETS, CURRENT_USER } from './mockData';
import { translations } from './translations';
import { apiClient } from './api';

// --- CONFIGURATION ---
// Set this to true to enable backend server integration.
const USE_BACKEND = false; 

const STORAGE_KEY = 'finance_manager_enterprise_v3';

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
    language: 'zh',
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
    const parsed = JSON.parse(item);
    return { ...INITIAL_DATA, ...parsed, settings: { ...INITIAL_DATA.settings, ...parsed.settings } };
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
    if (USE_BACKEND) {
       apiClient.getBootstrapData()
         .then(serverData => setData(serverData))
         .catch(err => console.warn("Failed to connect to backend, falling back to local.", err));
    } else {
       const handleStorageChange = () => setData(getStorageData());
       window.addEventListener('finance-data-update', handleStorageChange);
       return () => window.removeEventListener('finance-data-update', handleStorageChange);
    }
  }, []);

  useEffect(() => {
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [data.settings.theme]);

  const t = (key: string): string => {
    const lang = data.settings.language || 'zh';
    const keys = key.split('.');
    let value: any = translations[lang];
    for (const k of keys) {
      if (value && value[k]) value = value[k];
      else return key;
    }
    return value;
  };

  const logAction = (currentData: FinanceData, action: AuditLog['action'], entity: AuditLog['entity'], details: string, changes?: AuditChange[], entityId?: string) => {
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

  const addVoucher = async (voucher: Omit<Voucher, 'id' | 'voucherNumber'>) => {
    if (USE_BACKEND) {
        await apiClient.createVoucher(voucher);
        const newData = await apiClient.getBootstrapData();
        setData(newData);
        return;
    }

    let newData = { ...data };
    if (newData.settings.lockDate && voucher.date <= newData.settings.lockDate) {
      alert(`无法在锁定日期 (${newData.settings.lockDate}) 之前添加凭证。`);
      return;
    }
    const newId = crypto.randomUUID();
    const dateStr = voucher.date.replace(/-/g, '');
    const count = newData.vouchers.filter(v => v.date === voucher.date).length + 1;
    const voucherNumber = `V-${dateStr}-${count.toString().padStart(3, '0')}`;
    const newVoucher: Voucher = { ...voucher, id: newId, voucherNumber, createdBy: CURRENT_USER.name };
    newData.vouchers = [newVoucher, ...newData.vouchers];
    newData = logAction(newData, 'create', 'voucher', `创建凭证 ${voucherNumber}: ${voucher.description}`, [], newId);
    setStorageData(newData);
  };

  const updateVoucherStatus = async (id: string, status: Voucher['status']) => {
    if (USE_BACKEND) {
        await apiClient.updateVoucherStatus(id, status);
        const newData = await apiClient.getBootstrapData();
        setData(newData);
        return;
    }

    let newData = { ...data };
    const voucher = newData.vouchers.find(v => v.id === id);
    if (voucher) {
      newData.vouchers = newData.vouchers.map(v => v.id === id ? { ...v, status } : v);
      newData = logAction(newData, 'approve', 'voucher', `更新凭证 ${voucher.voucherNumber} 状态为 ${status}`, [], id);
      setStorageData(newData);
    }
  };

  const addAccount = async (account: Omit<Account, 'id'>) => {
    if(USE_BACKEND) {
        await apiClient.createAccount(account);
        setData(await apiClient.getBootstrapData());
        return;
    }
    let newData = { ...data };
    const newId = crypto.randomUUID();
    newData.accounts.push({ ...account, id: newId });
    newData = logAction(newData, 'create', 'account', `新增科目 ${account.name}`, [], newId);
    setStorageData(newData);
  };

  const addAsset = async (asset: Omit<FixedAsset, 'id'>) => {
    if(USE_BACKEND) {
        await apiClient.createAsset(asset);
        setData(await apiClient.getBootstrapData());
        return;
    }
    let newData = { ...data };
    const newId = crypto.randomUUID();
    newData.fixedAssets.push({ ...asset, id: newId });
    newData = logAction(newData, 'create', 'asset', `新增固定资产 ${asset.name}`, [], newId);
    setStorageData(newData);
  };

  const runDepreciation = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existing = data.vouchers.find(v => v.voucherNumber.startsWith(`SYS-DEP-${currentMonth}`));
    if (existing) {
        alert('本月折旧已计提，请勿重复操作！');
        return;
    }

    if(USE_BACKEND) {
        try {
            const res = await apiClient.runDepreciation();
            if(res.amount === 0) alert("无需计提折旧");
            else alert("折旧执行成功");
            setData(await apiClient.getBootstrapData());
        } catch(e) {
            alert("折旧执行失败: " + e.message);
        }
        return;
    }

    // Local Logic (Fallback)
    let totalDep = 0;
    let newData = { ...data };
    newData.fixedAssets = newData.fixedAssets.map(asset => {
      const monthlyDep = (asset.originalValue - asset.salvageValue) / (asset.lifeYears * 12);
      if (asset.accumulatedDepreciation + monthlyDep <= asset.originalValue - asset.salvageValue) {
        totalDep += monthlyDep;
        return { ...asset, accumulatedDepreciation: asset.accumulatedDepreciation + monthlyDep };
      }
      return asset;
    });

    if (totalDep > 0) {
        const id = crypto.randomUUID();
        const voucherNumber = `SYS-DEP-${currentMonth}-001`;
        const newVoucher: Voucher = { 
            id, voucherNumber, date: new Date().toISOString().slice(0,10), 
            description: `系统计提折旧: ${currentMonth}`, status: 'posted', createdBy: 'SYSTEM', entries: [],
            attachments: []
        };
        newData.vouchers = [newVoucher, ...newData.vouchers];
        logAction(newData, 'create', 'asset', `执行系统折旧 ${currentMonth}`, [{field: 'amount', oldValue: 0, newValue: totalDep}], id);
    }
    setStorageData(newData);
  };

  const addBalanceItem = async (item: Omit<BalanceItem, 'id'>) => {
      if(USE_BACKEND) {
          await apiClient.addBalanceItem(item);
          setData(await apiClient.getBootstrapData());
          return;
      }
      let newData = { ...data };
      const newItem = { ...item, id: crypto.randomUUID() };
      if (item.type === 'asset') newData.assets.push(newItem);
      else newData.liabilities.push(newItem);
      setStorageData(newData);
  };

  const deleteBalanceItem = async (id: string, type: 'asset' | 'liability') => {
      if(USE_BACKEND) {
          await apiClient.deleteBalanceItem(id);
          setData(await apiClient.getBootstrapData());
          return;
      }
      let newData = { ...data };
      if (type === 'asset') newData.assets = newData.assets.filter(a => a.id !== id);
      else newData.liabilities = newData.liabilities.filter(l => l.id !== id);
      setStorageData(newData);
  };

  const updateSettings = async (settings: Partial<AppSettings>) => {
    if(USE_BACKEND) {
        await apiClient.updateSettings(settings);
        setData(await apiClient.getBootstrapData());
        return;
    }
    let newData = { ...data };
    newData.settings = { ...newData.settings, ...settings };
    setStorageData(newData);
  };

  // --- Shared Helpers (Read-Only) ---
  const getTrialBalance = () => {
    const balances: Record<string, number> = {}; 
    data.accounts.forEach(a => balances[a.id] = 0);
    data.vouchers.forEach(v => {
      v.entries.forEach(e => {
        if (balances[e.accountId] !== undefined) balances[e.accountId] += (e.debit - e.credit);
      });
    });
    return balances;
  };

  const getRangeTrialBalance = (startDate: string, endDate: string) => {
    const result: Record<string, { debit: number, credit: number }> = {};
    data.accounts.forEach(a => result[a.id] = { debit: 0, credit: 0 });
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
        if (netProfit > 0) closingEntries.push({ accountId: retainedEarningsAcc.id, debit: 0, credit: netProfit });
        else if (netProfit < 0) closingEntries.push({ accountId: retainedEarningsAcc.id, debit: Math.abs(netProfit), credit: 0 });
    }

    return { totalRevenue, totalExpense, netProfit, closingEntries, endDate };
  };

  const executeClosing = async (year: number, month: number) => {
    const preview = previewClosingEntry(year, month);
    if (preview.closingEntries.length === 0) return;

    if (USE_BACKEND) {
        await apiClient.executeClosing(year, month, preview.closingEntries);
        setData(await apiClient.getBootstrapData());
        return;
    }

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
    newData.settings.lockDate = preview.endDate;
    logAction(newData, 'create', 'voucher', `执行月末结账 ${year}-${month}`, [], closingVoucher.id);
    setStorageData(newData);
  };

  // Wrappers
  const toggleTheme = () => {
      const newTheme = data.settings.theme === 'light' ? 'dark' : 'light';
      updateSettings({ theme: newTheme });
  };
  const toggleLanguage = () => {
      const newLang = data.settings.language === 'zh' ? 'en' : 'zh';
      updateSettings({ language: newLang });
  };
  const addCategory = (type: 'income' | 'expense', category: string) => {
      const list = type === 'income' ? [...data.settings.incomeCategories, category] : [...data.settings.expenseCategories, category];
      updateSettings(type === 'income' ? { incomeCategories: list } : { expenseCategories: list });
  };
  const removeCategory = (type: 'income' | 'expense', category: string) => {
      const list = type === 'income' ? data.settings.incomeCategories.filter(c=>c!==category) : data.settings.expenseCategories.filter(c=>c!==category);
      updateSettings(type === 'income' ? { incomeCategories: list } : { expenseCategories: list });
  };
  const importData = (jsonStr: string) => { 
      if(USE_BACKEND) { alert("Backend import not supported yet."); return false; }
      try {
        const imported = JSON.parse(jsonStr);
        setStorageData(imported);
        return true;
      } catch(e) { return false; }
  };
  const resetData = () => {
      if(USE_BACKEND) { alert("Please reset database manually."); return; }
      setStorageData(INITIAL_DATA);
      window.location.reload();
  };

  return {
    data,
    addVoucher,
    updateVoucherStatus,
    addAccount,
    addAsset,
    runDepreciation,
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
    executeClosing,
    resetData,
    getTrialBalance,
    getRangeTrialBalance
  };
};