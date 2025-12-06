
export enum AccountType {
  ASSET = 'Asset',         // 资产
  LIABILITY = 'Liability', // 负债
  EQUITY = 'Equity',       // 权益
  REVENUE = 'Revenue',     // 收入
  EXPENSE = 'Expense'      // 费用 (成本+损益)
}

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  AUDITOR = 'auditor'
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
}

export interface JournalEntry {
  accountId: string;
  debit: number;
  credit: number;
}

export interface Voucher {
  id: string;
  voucherNumber: string; // e.g., V-20231001-001
  date: string;
  description: string; // 摘要
  entries: JournalEntry[];
  status: 'draft' | 'reviewed' | 'posted';
  attachments?: string[]; // array of base64 images
  createdBy: string;
}

export interface FixedAsset {
  id: string;
  name: string;
  purchaseDate: string;
  originalValue: number; // 原值
  salvageValue: number; // 残值
  lifeYears: number; // 使用年限
  accumulatedDepreciation: number; // 累计折旧
  method: 'straight-line'; 
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'login';
  entity: 'voucher' | 'account' | 'asset' | 'settings' | 'transaction';
  entityId?: string;
  details: string; // Human readable summary
  changes?: AuditChange[]; // Granular field changes
}

export interface AuditRuleResult {
  id: string;
  severity: 'high' | 'medium' | 'low';
  ruleName: string;
  description: string;
  suggestion: string;
  relatedVoucherId?: string;
}

export interface AppSettings {
  companyName: string;
  currency: string;
  lockDate: string; // 月末结账锁定日期
  theme: 'light' | 'dark';
  incomeCategories: string[];
  expenseCategories: string[];
}

// Types for Simple Bookkeeping Mode (Transaction-based)
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  description: string;
  accountType?: 'company' | 'personal';
}

export interface BalanceItem {
  id: string;
  name: string;
  amount: number;
  type: 'asset' | 'liability';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface AuditAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  date: string;
  type?: string;
}

export interface FinanceData {
  accounts: Account[];
  vouchers: Voucher[];
  fixedAssets: FixedAsset[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  // Simple Mode Data
  transactions: Transaction[];
  assets: BalanceItem[];     // Simple assets list
  liabilities: BalanceItem[]; // Simple liabilities list
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}
