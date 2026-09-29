import React from 'react';
import { 
  Truck, 
  Package, 
  Users, 
  ShieldCheck, 
  History, 
  LogOut, 
  LayoutDashboard, 
  AlertTriangle, 
  ArrowRightLeft, 
  CheckCircle2, 
  UserCheck, 
  Lock, 
  X,
  FileText,
  ChevronRight,
  Settings
} from 'lucide-react';
import type { User, UserRole, Order } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggleButton } from './ThemeToggleButton';
import { AiaLogo } from './AiaLogo';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface Props {
  user: User;
  orders: Order[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  user,
  orders,
  activeTab,
  onSelectTab,
  onLogout,
  isOpenMobile,
  onCloseMobile
}) => {
  // Build role-specific navigation tabs
  const getTabsForRole = (role: UserRole): TabItem[] => {
    switch (role) {
      case 'DRIVER': {
        const pendingCount = orders.filter(o => o.driverId === user.driverId && o.operationalStatus !== 'LIVRE').length;
        const deliveredCount = orders.filter(o => o.driverId === user.driverId && o.operationalStatus === 'LIVRE').length;
        return [
          { id: 'deliveries', label: 'Tournée en Cours', icon: Truck, badge: pendingCount > 0 ? pendingCount : undefined },
          { id: 'delivered_history', label: 'Historique & Preuves', icon: CheckCircle2, badge: deliveredCount > 0 ? deliveredCount : undefined },
          { id: 'driver_info', label: 'Profil & Véhicule', icon: UserCheck }
        ];
      }
      case 'CARRIER': {
        const unassignedCount = orders.filter(o => o.carrierId === user.carrierId && !o.driverId).length;
        return [
          { id: 'orders', label: 'Ordres de Transport', icon: Package, badge: unassignedCount > 0 ? `${unassignedCount} à affecter` : undefined },
          { id: 'drivers', label: 'Flotte de Chauffeurs', icon: Users },
          { id: 'security_status', label: 'Isolation Tenant', icon: ShieldCheck }
        ];
      }
      case 'LOGISTICS': {
        const criticalCount = orders.filter(o => o.billingStatus === 'NON_FACTUREE' && o.operationalStatus !== 'LIVRE').length;
        return [
          { id: 'dashboard', label: 'Tableau de Bord & KPIs', icon: LayoutDashboard },
          { id: 'orders', label: 'Suivi des Commandes', icon: Package, badge: orders.length },
          { id: 'unbilled_undelivered', label: 'Non Facturées / Non Livrées', icon: AlertTriangle, badge: criticalCount > 0 ? criticalCount : undefined },
          { id: 'erp', label: 'Passerelle ERP Découplée', icon: ArrowRightLeft }
        ];
      }
      case 'ADMIN':
      default:
        return [
          { id: 'dashboard', label: 'Tableau de Bord & KPIs', icon: LayoutDashboard },
          { id: 'orders', label: 'Toutes les Commandes', icon: Package, badge: orders.length },
          { id: 'carriers', label: 'Transporteurs & Flottes', icon: Truck },
          { id: 'settings', label: 'Paramètres', icon: Settings },
          { id: 'security', label: 'Banc de Tests Anti-IDOR', icon: Lock },
          { id: 'audit', label: 'Grand Livre d’Audit', icon: History }
        ];
    }
  };

  const tabs = getTabsForRole(user.role);

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-[#e11d2a]/15 text-[#e11d2a] border-[#e11d2a]/30';
      case 'LOGISTICS': return 'bg-[#1ea844]/15 text-[#1ea844] border-[#1ea844]/30';
      case 'CARRIER': return 'bg-[#1ea844]/15 text-[#1ea844] border-[#1ea844]/30';
      case 'DRIVER': return 'bg-[#e11d2a]/15 text-[#e11d2a] border-[#e11d2a]/30';
    }
  };

  const handleTabClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container - Fixed viewport height on desktop and mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 h-screen max-h-screen bg-white dark:bg-[#0b0f19] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:max-h-screen overflow-hidden ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Branding - Cleanly bounded, no overflow */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-hidden shrink-0">
          <AiaLogo variant="sidebar" />

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer shrink-0"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="p-3 mx-3 my-2 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e11d2a]/15 text-[#e11d2a] font-extrabold flex items-center justify-center text-xs border border-[#e11d2a]/30 shadow-inner shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{user.name}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getRoleBadgeStyle(user.role)}`}>
                  {user.role}
                </span>
                {user.carrierId && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    #{user.carrierId.replace('carr_', '')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs List - Internally scrollable, preserving top and bottom elements */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 min-h-0">
          <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
            Navigation Opérationnelle
          </span>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full px-3.5 py-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition group active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-[#e11d2a] !text-white shadow-lg shadow-red-950/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? '!text-white' : 'text-slate-400 group-hover:text-[#e11d2a] transition'}`} />
                  <span className={`truncate ${isActive ? '!text-white' : ''}`}>{tab.label}</span>
                </div>

                {tab.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-white/20 !text-white'
                      : 'bg-[#1ea844]/15 text-[#1ea844] border border-[#1ea844]/30'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions: Theme Toggle, PWA Install & Logout - Always visible on screen */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2 bg-slate-50/70 dark:bg-slate-950/50 shrink-0">
          <ThemeToggleButton variant="sidebar" />

          <div className="w-full">
            <PWAInstallButton />
          </div>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-500/40 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#e11d2a] dark:hover:text-red-400 flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>

      </aside>
    </>
  );
};
