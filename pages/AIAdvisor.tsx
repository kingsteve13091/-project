
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, AccountType } from '../types';
import { useFinanceData } from '../services/storage';

const AIAdvisor = () => {
  const { data, t } = useFinanceData();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset welcome message when language changes
    setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: t('ai.welcome'),
          timestamp: new Date()
        }
    ]);
  }, [data.settings.language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Aggregate financial data to provide context for the AI
  const getFinancialContext = () => {
    // 1. Snapshot Balances
    const getNetBalance = (type: AccountType) => {
      let total = 0;
      data.accounts.filter(a => a.type === type).forEach(acc => {
         const accEntries = data.vouchers.flatMap(v => v.entries.filter(e => e.accountId === acc.id));
         const dr = accEntries.reduce((s, e) => s + e.debit, 0);
         const cr = accEntries.reduce((s, e) => s + e.credit, 0);
         if (type === AccountType.ASSET || type === AccountType.EXPENSE) total += (dr - cr);
         else total += (cr - dr);
      });
      return total;
    };

    const assets = getNetBalance(AccountType.ASSET);
    const liabilities = getNetBalance(AccountType.LIABILITY);
    const equity = getNetBalance(AccountType.EQUITY);
    const revenue = getNetBalance(AccountType.REVENUE);
    const expense = getNetBalance(AccountType.EXPENSE);
    const profit = revenue - expense;

    // 2. 3-Month Trend Analysis
    const now = new Date();
    const monthlyTrends = [];
    
    // Calculate for current month and previous 2 months
    for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth(); // 0-11
        const monthLabel = d.toLocaleString(data.settings.language === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' });

        let mRevenue = 0;
        let mExpense = 0;

        data.vouchers.forEach(v => {
            const vDate = new Date(v.date);
            if (vDate.getFullYear() === year && vDate.getMonth() === month) {
                v.entries.forEach(e => {
                    const acc = data.accounts.find(a => a.id === e.accountId);
                    if (acc?.type === AccountType.REVENUE) mRevenue += (e.credit - e.debit);
                    if (acc?.type === AccountType.EXPENSE) mExpense += (e.debit - e.credit);
                });
            }
        });

        monthlyTrends.push(`- ${monthLabel}: Income ${mRevenue.toLocaleString()}, Expense ${mExpense.toLocaleString()}, Net ${mRevenue - mExpense}`);
    }

    // 3. Recent Vouchers
    const recentVouchers = data.vouchers.slice(0, 10).map(v => 
      `- ${v.date} (${v.voucherNumber}): ${v.description} | Total Amount: ${v.entries.reduce((s, e) => s + e.debit, 0).toLocaleString()}`
    ).join('\n');

    return `
    Financial Overview (Currency: ${data.settings.currency}):
    - Total Assets: ${assets.toLocaleString()}
    - Total Liabilities: ${liabilities.toLocaleString()}
    - Total Equity: ${equity.toLocaleString()}
    - Cumulative Revenue (YTD): ${revenue.toLocaleString()}
    - Cumulative Expense (YTD): ${expense.toLocaleString()}
    - Net Profit (YTD): ${profit.toLocaleString()}

    Recent 3-Month Trend (Crucial for analysis):
    ${monthlyTrends.join('\n')}

    Recent Transactions (Last 10):
    ${recentVouchers}
    
    Company Name: ${data.settings.companyName}
    `;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = getFinancialContext();
      const langInstruction = data.settings.language === 'zh' ? 'Answer in Chinese (Simplified).' : 'Answer in English.';
      
      const systemInstruction = `You are an expert financial advisor for an education center called "${data.settings.companyName}".
      You have access to the real-time financial data of the company below.

      DATA CONTEXT:
      ${context}

      INSTRUCTIONS:
      1. Answer the user's questions based strictly on the provided data.
      2. Pay special attention to the "Recent 3-Month Trend". Analyze if revenue is growing, shrinking, or stable, and if expenses are under control.
      3. If the user asks for advice, provide specific, actionable recommendations (e.g., "Cut marketing costs as they rose 20% last month" or "Focus on tuition collection").
      4. Be professional, concise, and helpful.
      5. Use Markdown for formatting (bold, lists) to make the response readable.
      6. ${langInstruction}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: input,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const text = response.text;

      const responseMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text || "System busy.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, responseMsg]);

    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: t('ai.error'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <Sparkles className="text-white" size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white">{t('ai.title')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('ai.subtitle')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-100 dark:bg-indigo-900'}`}>
              {msg.role === 'user' ? <User size={16} className="text-slate-600 dark:text-slate-300" /> : <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-slate-900 text-white rounded-tr-none' 
                : 'bg-slate-50 dark:bg-slate-900 dark:text-slate-200 text-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none px-5 py-3 flex items-center gap-2">
              <Loader size={16} className="animate-spin text-slate-400" />
              <span className="text-xs text-slate-500">{t('ai.analyzing')}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('ai.placeholder')}
            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-slate-900 dark:text-white text-sm transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAdvisor;
