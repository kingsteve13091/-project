
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader, CheckCircle2, Mail, Lock, KeyRound, User, ChevronRight } from 'lucide-react';
import { useFinanceData } from '../services/storage';
import { apiClient } from '../services/api';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCode, setRegCode] = useState('');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [codeSending, setCodeSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();
  const { t } = useFinanceData();

  useEffect(() => {
    let timer: any;
    if (codeCountdown > 0) {
      timer = setInterval(() => setCodeCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [codeCountdown]);

  const handleSendCode = async () => {
    if (!regEmail || !regEmail.includes('@')) {
      setErrorMsg('请输入有效的邮箱地址');
      return;
    }
    setErrorMsg('');
    setCodeSending(true);
    try {
      await apiClient.sendVerificationCode(regEmail);
      setCodeCountdown(60);
      alert('验证码已发送，请检查您的邮箱（包括垃圾邮件）。');
    } catch (err: any) {
      setErrorMsg(err.message || '发送失败，请检查邮箱地址或稍后重试');
    } finally {
      setCodeSending(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      // Try backend login first
      await apiClient.login(email, password);
      onLogin();
      navigate('/dashboard');
    } catch (err: any) {
      // If backend fails (or not running in strict frontend mode), show error
      console.warn("Backend login failed:", err);
      setErrorMsg(err.message || '登录失败，请检查账号密码');
      
      // Fallback for Demo Mode Only (Simulate login if USE_BACKEND is false)
      const isBackendEnabled = false; // Check storage.ts config if needed
      if (!isBackendEnabled && (email === 'admin@company.com' || email === 'demo@company.com')) {
          onLogin();
          navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await apiClient.register(regEmail, regPassword, regCode, regName);
      onLogin(); // Auto login after register
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || '注册失败');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-indigo-500/30">
      {/* Left Panel - Brand & Value Prop */}
      <div className="hidden lg:flex lg:w-5/12 relative bg-slate-900 overflow-hidden items-center justify-center">
         {/* Abstract Background */}
         <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950"></div>
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
         <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl mix-blend-screen"></div>
         
         <div className="relative z-10 p-12 text-white max-w-md">
           <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center mb-10 shadow-2xl shadow-indigo-900/50">
             <span className="text-2xl font-bold">¥</span>
           </div>
           
           <h1 className="text-3xl font-bold tracking-tight mb-6 leading-tight text-white whitespace-pre-line">
             {t('login.brand_title')}
           </h1>
           
           <div className="space-y-5 text-slate-300">
             <div className="flex items-start gap-4 group">
               <div className="p-1 rounded bg-emerald-500/10 text-emerald-400 mt-0.5 group-hover:bg-emerald-500/20 transition-colors">
                 <CheckCircle2 size={18} />
               </div>
               <div>
                 <h3 className="font-medium text-white text-sm">{t('login.feature_1_title')}</h3>
                 <p className="text-xs text-slate-400 mt-1">{t('login.feature_1_desc')}</p>
               </div>
             </div>
             
             <div className="flex items-start gap-4 group">
               <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 mt-0.5 group-hover:bg-indigo-500/20 transition-colors">
                 <CheckCircle2 size={18} />
               </div>
               <div>
                 <h3 className="font-medium text-white text-sm">{t('login.feature_2_title')}</h3>
                 <p className="text-xs text-slate-400 mt-1">{t('login.feature_2_desc')}</p>
               </div>
             </div>
           </div>

           <div className="mt-16 pt-8 border-t border-white/10 flex justify-between items-center text-xs text-slate-500 font-medium">
             <span>Finance Manager Enterprise</span>
             <span>v3.0.0</span>
           </div>
         </div>
      </div>

      {/* Right Panel - Login/Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-slate-950 relative">
        <div className="w-full max-w-[420px]">
          
          {/* Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl mb-8 w-fit mx-auto lg:mx-0">
             <button 
               onClick={() => { setMode('login'); setErrorMsg(''); }}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               {t('login.submit')}
             </button>
             <button 
               onClick={() => { setMode('register'); setErrorMsg(''); }}
               className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'register' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               注册账号
             </button>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {mode === 'login' ? t('login.title') : '创建新账户'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'login' ? t('login.subtitle') : '通过 163 邮箱验证码注册。'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
               {errorMsg}
            </div>
          )}

          {mode === 'login' ? (
             <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('login.email')}</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('login.password')}</label>
                  <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">{t('login.forgot')}</a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" /> {t('login.verifying')}
                  </>
                ) : (
                  <>
                    {t('login.submit')} <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div className="space-y-1.5">
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">姓名</label>
                 <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                      placeholder="您的姓名"
                      required
                    />
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">{t('login.email')}</label>
                 <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                      placeholder="name@company.com"
                      required
                    />
                 </div>
              </div>
              
              <div className="space-y-1.5">
                 <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">验证码</label>
                 <div className="flex gap-2">
                    <div className="relative group flex-1">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
                      <input
                        type="text"
                        value={regCode}
                        onChange={(e) => setRegCode(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                        placeholder="6位验证码"
                        required
                        maxLength={6}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleSendCode}
                      disabled={codeCountdown > 0 || codeSending || !regEmail}
                      className="w-32 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
                    >
                      {codeSending ? <Loader size={14} className="animate-spin mx-auto" /> : codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码'}
                    </button>
                 </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">设置密码</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
              >
                {loading ? (
                  <>
                    <Loader size={18} className="animate-spin" /> 注册中...
                  </>
                ) : (
                  <>
                    立即注册 <ChevronRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-4">
             <p className="text-xs text-slate-400">
               {t('login.demo')}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
