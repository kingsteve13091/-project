
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, ScrollText, 
  Landmark, PieChart, BrainCircuit, Settings, LogOut, X, Menu, 
  ShieldCheck, History, Calculator, Lock, BookOpen, UserCircle2
} from 'lucide-react';
import { User } from '../types';
import { useFinanceData } from '../services/storage';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-200 text-sm group ${
        isActive 
          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-l-4 border-indigo-600 dark:border-indigo-500' 
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200 border-l-4 border-transparent'
      }`
    }
  >
    <Icon size={18} className="opacity-80 group-hover:opacity-100 transition-opacity" />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { data, t } = useFinanceData();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-200">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-72 bg-[#FBFBFB] dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transform transition-transform duration-300 ease-out flex flex-col shadow-xl md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-slate-800 dark:text-white">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
                <span className="font-bold text-xl font-mono">{data.settings.currency}</span>
              </div>
              <div className="leading-tight overflow-hidden">
                <h1 className="font-bold text-base truncate" title={data.settings.companyName}>{data.settings.companyName}</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{t('common.appName')}</p>
              </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-6 scrollbar-hide py-4">
          {/* Group 1 */}
          <div>
            <h3 className="px-6 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{t('sidebar.workbench')}</h3>
            <div className="space-y-0.5">
              <SidebarItem to="/dashboard" icon={LayoutDashboard} label={t('sidebar.dashboard')} />
              <SidebarItem to="/record" icon={PlusCircle} label={t('sidebar.record')} />
              <SidebarItem to="/assets" icon={Calculator} label={t('sidebar.assets')} />
            </div>
          </div>

          {/* Group 2 */}
          <div>
            <h3 className="px-6 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{t('sidebar.accounting')}</h3>
            <div className="space-y-0.5">
              <SidebarItem to="/vouchers" icon={ScrollText} label={t('sidebar.vouchers')} />
              <SidebarItem to="/records" icon={BookOpen} label={t('sidebar.records')} />
              <SidebarItem to="/trial-balance" icon={Landmark} label={t('sidebar.trial_balance')} />
              <SidebarItem to="/statements" icon={PieChart} label={t('sidebar.statements')} />
              <SidebarItem to="/closing" icon={Lock} label={t('sidebar.closing')} />
            </div>
          </div>

          {/* Group 3 */}
          <div>
            <h3 className="px-6 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{t('sidebar.risk')}</h3>
            <div className="space-y-0.5">
              <SidebarItem to="/audit-check" icon={ShieldCheck} label={t('sidebar.audit_check')} />
              <SidebarItem to="/audit-log" icon={History} label={t('sidebar.audit_log')} />
              <SidebarItem to="/ai" icon={BrainCircuit} label={t('sidebar.ai')} />
            </div>
          </div>
        </nav>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <SidebarItem to="/settings" icon={Settings} label={t('sidebar.settings')} />
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 px-2">
             <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-600 flex-shrink-0">
                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
               <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
             </div>
             <button 
               onClick={onLogout}
               className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
               title={t('sidebar.logout')}
             >
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative scroll-smooth bg-[#F9FAFB] dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* Mobile Header with Glassmorphism */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white truncate">
            <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs shadow-sm flex-shrink-0">{data.settings.currency}</div>
            <span className="truncate">{data.settings.companyName}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
            <Menu size={20} />
          </button>
        </div>

        <div className="max-w-[1600px] mx-auto p-4 md:p-8 lg:p-10 min-h-full">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
