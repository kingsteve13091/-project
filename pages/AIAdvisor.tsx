
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, AccountType } from '../types';
import { useFinanceData } from '../services/storage';

const AIAdvisor = () => {
  const { data } = useFinanceData();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "你好！我是你的智能财务顾问。我已经连接到你的本地账本，并集成了 Gemini AI 模型。\n\n你可以问我：\n• “分析一下本月的财务状况”\n• “根据目前的支出趋势，有什么节省成本的建议？”\n• “我的资产负债结构健康吗？”",
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Aggregate financial data to provide context for the AI
  const getFinancialContext = () => {
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

    // Recent vouchers summary (Last 10)
    const recentVouchers = data.vouchers.slice(0, 10).map(v => 
      `- ${v.date} (${v.voucherNumber}): ${v.description} | Amount: ¥${v.entries[0]?.debit}`
    ).join('\n');

    return `
    Financial Overview (Currency: ${data.settings.currency}):
    - Total Assets: ${assets.toLocaleString()}
    - Total Liabilities: ${liabilities.toLocaleString()}
    - Total Equity: ${equity.toLocaleString()}
    - Cumulative Revenue: ${revenue.toLocaleString()}
    - Cumulative Expense: ${expense.toLocaleString()}
    - Net Profit: ${profit.toLocaleString()}

    Recent Transactions (Last 10):
    ${recentVouchers}
    
    Company Name: ${data.settings.companyName}
    Expense Categories: ${data.settings.expenseCategories.join(', ')}
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
      
      const systemInstruction = `You are an expert financial advisor for an education center called "${data.settings.companyName}".
      You have access to the following real-time financial data of the company:
      
      ${context}

      Your goal is to answer the user's questions based on this data. 
      - Provide financial analysis, risk assessment, and cost-saving advice.
      - Be professional, concise, and helpful.
      - If the data suggests risks (e.g., high liabilities, negative profit), point them out gently.
      - Use Markdown for formatting (bold, lists) to make the response readable.
      - Answer in the same language as the user's question (mostly Chinese).
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
        text: text || "系统繁忙，未能生成回答。",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, responseMsg]);

    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "抱歉，连接 AI 服务时出现错误。请检查网络或 API Key 配置。",
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
          <h2 className="font-bold text-slate-900 dark:text-white">AI 智能财务顾问</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Powered by Gemini 2.5 Flash • 实时分析</p>
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
              <span className="text-xs text-slate-500">正在分析账本数据...</span>
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
            placeholder="问我财务问题，例如：本月餐饮花了多少？"
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
