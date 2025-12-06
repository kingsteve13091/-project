
import { Account, AccountType, Voucher, FixedAsset, UserRole, Transaction } from '../types';

export const DEFAULT_ACCOUNTS: Account[] = [
  // 资产类 (Assets)
  { id: '1001', code: '1001', name: '库存现金', type: AccountType.ASSET },
  { id: '1002', code: '1002', name: '银行存款', type: AccountType.ASSET },
  { id: '1122', code: '1122', name: '应收账款', type: AccountType.ASSET },
  { id: '1123', code: '1123', name: '预付账款', type: AccountType.ASSET },
  { id: '1221', code: '1221', name: '其他应收款', type: AccountType.ASSET },
  { id: '1403', code: '1403', name: '原材料', type: AccountType.ASSET },
  { id: '1405', code: '1405', name: '库存商品', type: AccountType.ASSET },
  { id: '1601', code: '1601', name: '固定资产', type: AccountType.ASSET },
  { id: '1602', code: '1602', name: '累计折旧', type: AccountType.ASSET },
  { id: '1701', code: '1701', name: '无形资产', type: AccountType.ASSET },
  { id: '1801', code: '1801', name: '长期待摊费用', type: AccountType.ASSET },
  { id: '1901', code: '1901', name: '待处理财产损溢', type: AccountType.ASSET },

  // 负债类 (Liabilities)
  { id: '2001', code: '2001', name: '短期借款', type: AccountType.LIABILITY },
  { id: '2201', code: '2201', name: '应付票据', type: AccountType.LIABILITY },
  { id: '2202', code: '2202', name: '应付账款', type: AccountType.LIABILITY },
  { id: '2203', code: '2203', name: '预收账款', type: AccountType.LIABILITY },
  { id: '2211', code: '2211', name: '应付职工薪酬', type: AccountType.LIABILITY },
  { id: '2221', code: '2221', name: '应交税费', type: AccountType.LIABILITY },
  { id: '2231', code: '2231', name: '应付利息', type: AccountType.LIABILITY },
  { id: '2241', code: '2241', name: '其他应付款', type: AccountType.LIABILITY },

  // 所有者权益 (Equity)
  { id: '4001', code: '4001', name: '实收资本', type: AccountType.EQUITY },
  { id: '4002', code: '4002', name: '资本公积', type: AccountType.EQUITY },
  { id: '4103', code: '4103', name: '本年利润', type: AccountType.EQUITY },
  { id: '4104', code: '4104', name: '利润分配', type: AccountType.EQUITY },

  // 损益类 - 收入 (Revenue)
  { id: '6001', code: '6001', name: '主营业务收入', type: AccountType.REVENUE },
  { id: '6051', code: '6051', name: '其他业务收入', type: AccountType.REVENUE },
  { id: '6111', code: '6111', name: '投资收益', type: AccountType.REVENUE },
  { id: '6301', code: '6301', name: '营业外收入', type: AccountType.REVENUE },

  // 损益类 - 费用 (Expense)
  { id: '6401', code: '6401', name: '主营业务成本', type: AccountType.EXPENSE },
  { id: '6403', code: '6403', name: '税金及附加', type: AccountType.EXPENSE },
  { id: '6601', code: '6601', name: '销售费用', type: AccountType.EXPENSE },
  { id: '6602', code: '6602', name: '管理费用', type: AccountType.EXPENSE },
  { id: '6603', code: '6603', name: '财务费用', type: AccountType.EXPENSE },
  { id: '6711', code: '6711', name: '营业外支出', type: AccountType.EXPENSE },
  { id: '6801', code: '6801', name: '所得税费用', type: AccountType.EXPENSE },
];

export const SEED_VOUCHERS: Voucher[] = [];

export const SEED_ASSETS: FixedAsset[] = [
  {
    id: 'fa-1',
    name: 'MacBook Pro 笔记本',
    purchaseDate: '2023-01-15',
    originalValue: 15000,
    salvageValue: 750, // 5% 残值
    lifeYears: 3,
    accumulatedDepreciation: 5000,
    method: 'straight-line'
  }
];

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    amount: 5000,
    type: 'income',
    category: 'Tuition Fees',
    date: '2023-10-01',
    description: 'Student fees',
    accountType: 'company'
  }
];

export const CURRENT_USER = {
  id: 'u1',
  name: '财务总监',
  email: 'cfo@company.com',
  role: UserRole.ADMIN,
  avatar: 'https://ui-avatars.com/api/?name=CFO&background=0D8ABC&color=fff'
};
