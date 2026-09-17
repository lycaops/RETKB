import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/lib/AppContext';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Globe,
  Calculator as CalcIcon,
  Users,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

const LOGO_URL = '/logo.png';

export default function Layout({ children }) {
  const { t, lang, setLang } = useApp();
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', label: t('nav_dashboard'), icon: LayoutDashboard },
    { to: '/calculator', label: t('nav_calculator'), icon: CalcIcon },
    { to: '/statement', label: t('nav_statement'), icon: FileText },
    { to: '/scheme', label: t('nav_scheme'), icon: BookOpen },
  ];

  if (user?.role === 'admin') {
    navItems.push({ to: '/users', label: t('nav_users'), icon: Users });
  }

  const roleLabel =
    user?.role === 'admin'
      ? 'Admin'
      : user?.role === 'branch_user'
        ? 'Branch'
        : user?.role === 'zone_user'
          ? 'Zone'
          : 'Viewer';

  const scopeLabel = profile?.zone_name
    ? `Zone: ${profile.zone_name}`
    : profile?.branch_name
      ? `Branch: ${profile.branch_name}`
      : '';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className="sticky top-0 h-screen w-64 shrink-0 hidden md:flex flex-col"
        style={{ backgroundColor: '#21264e' }}
      >
        <div className="px-6 py-6 border-b border-white/10">
          <img
            src="/logo.png"
            alt="Logo"
            crossOrigin="anonymous"
            className="h-8"
          />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-4 py-1 text-xs text-white/50">{t('appSubtitle')}</div>
          {profile?.branch_name && (
            <div className="px-4 py-1 text-[11px] text-white/50 truncate">
              {scopeLabel}
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo_b.webp" alt="Logo" crossOrigin="anonymous" className="h-8 w-auto md:hidden" />
            <h1 className="text-lg font-semibold text-slate-800">{t('appTitle')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-400" />
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                lang === 'en' ? 'bg-[#21264e] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('it')}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                lang === 'it' ? 'bg-[#21264e] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              IT
            </button>
            <div className="hidden md:flex items-center gap-2 pl-2 ml-1 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ backgroundColor: '#006AE0' }}>
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden lg:block">
                <div className="text-xs font-medium text-slate-800 leading-tight">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">{roleLabel}</div>
              </div>
              <button
                onClick={() => logout(true)}
                title="Log out"
                className="ml-1 p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex items-stretch justify-around border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-4px_16px_rgba(33,38,78,0.08)] backdrop-blur">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                title={item.label}
                aria-label={item.label}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                  active ? 'bg-[#21264e] text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={() => logout(true)}
            title="Logout"
            aria-label="Logout"
            className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </nav>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
