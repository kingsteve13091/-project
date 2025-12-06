
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, PlusCircle, ScrollText, 
  Landmark, PieChart, BrainCircuit, Settings, LogOut, X, Menu, 
  ShieldCheck, History, Calculator, FileText, Lock
} from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
}

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
        isActive 
          ? 'bg-slate-200/50 text-slate-900 dark:bg-slate-700 dark:text-white' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      }`
    }
  >
    <Icon size={18} className="opacity-80" />
    <span>{label}</span>
  </NavLink>
);

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#F9FAFB] dark:bg-slate-950 font-sans overflow-hidden transition-colors duration-200">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#FBFBFB] dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-800 dark:text-white font-semibold text-lg">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200/50">
              <span className="font-bold">¥</span>
            </div>
            <span>FinancePro</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-8 scrollbar-hide">
          {/* Group 1: Core Operations */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Workspace</h3>
            <div className="space-y-1">
              <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <SidebarItem to="/record" icon={PlusCircle} label="Smart Record" />
              <SidebarItem to="/assets" icon={Calculator} label="Fixed Assets" />
            </div>
          </div>

          {/* Group 2: Accountant View */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Accounting</h3>
            <div className="space-y-1">
              <SidebarItem to="/vouchers" icon={ScrollText} label="Vouchers" />
              <SidebarItem to="/trial-balance" icon={Landmark} label="科目余额表" />
              <SidebarItem to="/statements" icon={PieChart} label="Financial Statements" />
              <SidebarItem to="/closing" icon={Lock} label="Month-End Closing" />
            </div>
          </div>

          {/* Group 3: Auditor View */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Audit & Risks</h3>
            <div className="space-y-1">
              <SidebarItem to="/audit-check" icon={ShieldCheck} label="Audit Center" />
              <SidebarItem to="/audit-log" icon={History} label="Audit Trail" />
              <SidebarItem to="/ai" icon={BrainCircuit} label="AI Advisor" />
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200/60 dark:border-slate-800">
          <SidebarItem to="/settings" icon={Settings} label="System Settings" />
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs">¥</div>
            FinancePro
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
            <Menu size={20} />
          </button>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10 min-h-full">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
