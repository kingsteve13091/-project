
import { FinanceData, Voucher, Account, FixedAsset, AppSettings } from '../types';

// This is the client-side adapter for the Node.js Backend
// To use this, you would update useFinanceData to call these methods instead of localStorage.

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
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`,
      ...options.headers,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
  }

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if(!res.ok) throw new Error('Login failed');
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

  async updateSettings(settings: Partial<AppSettings>) {
    return this.fetch('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
}

export const apiClient = new FinanceApiClient();
