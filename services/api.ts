
import { FinanceData, Voucher, Account, FixedAsset, AppSettings, BalanceItem } from '../types';

const API_BASE = 'http://localhost:3001/api';

export class FinanceApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `API Error: ${res.statusText}`);
    }
    return res.json();
  }

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if(!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    this.setToken(data.token);
    return data.user;
  }

  async sendVerificationCode(email: string) {
    const res = await fetch(`${API_BASE}/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if(!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send code');
    }
    return res.json();
  }

  async register(email: string, password: string, code: string, name: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, code, name })
    });
    if(!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    this.setToken(data.token);
    return data.user;
  }

  async getBootstrapData(): Promise<FinanceData> {
    return this.fetch('/bootstrap');
  }

  async createVoucher(voucher: Partial<Voucher>) {
    return this.fetch('/vouchers', {
      method: 'POST',
      body: JSON.stringify(voucher)
    });
  }

  async updateVoucherStatus(id: string, status: string) {
    return this.fetch(`/vouchers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async createAsset(asset: Partial<FixedAsset>) {
    return this.fetch('/assets', {
      method: 'POST',
      body: JSON.stringify(asset)
    });
  }

  async runDepreciation() {
      return this.fetch('/assets/run-depreciation', {
          method: 'POST'
      });
  }

  async createAccount(account: Partial<Account>) {
    return this.fetch('/accounts', {
      method: 'POST',
      body: JSON.stringify(account)
    });
  }

  async updateSettings(settings: Partial<AppSettings>) {
    return this.fetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  async executeClosing(year: number, month: number, entries: any[]) {
    return this.fetch('/closing', {
      method: 'POST',
      body: JSON.stringify({ year, month, entries })
    });
  }

  async getAuditLogs() {
    return this.fetch('/audit-logs');
  }

  async addBalanceItem(item: Partial<BalanceItem>) {
    return this.fetch('/balance-items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  async deleteBalanceItem(id: string) {
    return this.fetch(`/balance-items/${id}`, {
      method: 'DELETE'
    });
  }
}

export const apiClient = new FinanceApiClient();
