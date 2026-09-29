import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Menu, 
  RefreshCw, 
  History, 
  ShieldCheck, 
  Package, 
  CheckCircle2, 
  UserCheck, 
  MapPin, 
  Clock, 
  AlertTriangle,
  ArrowRightLeft,
  X,
  ChevronRight
} from 'lucide-react';
import type { User, Order, Driver } from './types/index.ts';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DriverView } from './components/DriverView';
import { CarrierView } from './components/CarrierView';
import { LogisticsView } from './components/LogisticsView';
import { AdminView } from './components/AdminView';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { SecurityTestPanel } from './components/SecurityTestPanel';
import { ProofModal } from './components/ProofModal';
import { ThemeToggleButton } from './components/ThemeToggleButton';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { SettingsView } from './components/SettingsView';

const SESSION_STORAGE_KEY = 'logitrack_session_token';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [auditTargetOrderId, setAuditTargetOrderId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('deliveries');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);

  // 1. Initial check: load users and restore session if present
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users: User[] = await res.json();
        setAvailableUsers(users);

        // Check if there is a saved token in localStorage
        const savedToken = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedToken) {
          const matchedUser = users.find(u => u.id === savedToken);
          if (matchedUser && matchedUser.active) {
            handleLogin(matchedUser);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(SESSION_STORAGE_KEY, user.id);
    
    // Set default initial tab based on role
    switch (user.role) {
      case 'DRIVER':
        setActiveTab('deliveries');
        break;
      case 'CARRIER':
        setActiveTab('orders');
        break;
      case 'LOGISTICS':
        setActiveTab('dashboard');
        break;
      case 'ADMIN':
        setActiveTab('dashboard');
        break;
    }

    if (user.role === 'DRIVER' && user.driverId) {
      fetchDriverDetails(user.driverId, user.id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setOrders([]);
    setIsMobileSidebarOpen(false);
  };

  const fetchDriverDetails = async (driverId: string, token: string) => {
    try {
      const res = await fetch('/api/drivers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const driversList: Driver[] = await res.json();
        const drv = driversList.find(d => d.id === driverId);
        if (drv) setDriverProfile(drv);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Fetch orders scoped to current user
  const fetchOrders = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${currentUser.id}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  const openAuditWithOrder = (orderId?: string) => {
    setAuditTargetOrderId(orderId);
    setIsAuditOpen(true);
  };

  // -----------------------------------------------------------
  // If not logged in: Render dedicated Login Page
  // -----------------------------------------------------------
  if (!currentUser) {
    return <LoginPage users={availableUsers} onLogin={handleLogin} />;
  }

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'deliveries': return 'Tournée en Cours';
      case 'delivered_history': return 'Historique des Livraisons Certifiées';
      case 'driver_info': return 'Profil & Véhicule Affecté';
      case 'dashboard': return 'Tableau de Bord & Indicateurs';
      case 'orders': return currentUser.role === 'CARRIER' ? 'Ordres de Transport Reçus' : 'Gestion des Commandes';
      case 'drivers': return 'Flotte de Chauffeurs';
      case 'security_status': return 'Isolation Multi-Tenant';
      case 'unbilled_undelivered': return 'Commandes Non Facturées & Non Livrées';
      case 'erp': return 'Passerelle Découplée ERP';
      case 'carriers': return 'Transporteurs & Flottes Partenaires';
      case 'settings': return 'Paramètres Système & Base SAP';
      case 'security': return 'Banc de Tests Anti-IDOR';
      case 'audit': return 'Grand Livre d’Audit Immuable';
      default: return 'Portail AIA LogiTrack';
    }
  };

  // -----------------------------------------------------------
  // When logged in: Render Main App with Workspace Canvas
  // -----------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-[#e11d2a] selection:text-white">
      
      {/* Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Persistent Left Sidebar (Desktop) / Sliding Drawer (Mobile) */}
      <Sidebar
        user={currentUser}
        orders={orders}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Top Bar Contract (3 Zones) */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0b0f19]/90 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md px-4 py-3 sm:px-6 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            
            {/* Zone 1: Mobile Hamburger + Breadcrumb Trail */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 lg:hidden transition cursor-pointer"
                title="Ouvrir la navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#e11d2a]" />
                  AIA LogiTrack
                </span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate">{getBreadcrumbTitle()}</span>
              </div>
            </div>

            {/* Zone 2: Subdued Live Operational Telemetry pill (Desktop) */}
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1ea844] animate-pulse" />
                <span>Réseau Opérationnel AIA</span>
              </span>
              <span className="hidden xl:inline">·</span>
              <span className="hidden xl:inline text-slate-500 dark:text-slate-400">Espace {currentUser.role}</span>
            </div>

            {/* Zone 3: Actions (Theme Toggle, Refresh, Audit Drawer, User Badge) */}
            <div className="flex items-center gap-2 shrink-0">
              <ThemeToggleButton />

              <button
                onClick={fetchOrders}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer shadow-xs border border-slate-200/60 dark:border-slate-700/60"
                title="Actualiser les données"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#e11d2a]' : ''}`} />
              </button>

              <button
                onClick={() => openAuditWithOrder()}
                className="p-2 rounded-xl bg-[#1ea844]/15 hover:bg-[#1ea844]/25 text-[#1ea844] transition cursor-pointer shadow-xs border border-[#1ea844]/30"
                title="Grand Livre d'Audit"
              >
                <History className="w-4 h-4" />
              </button>
            </div>

          </div>
        </header>

        {/* Tab Content Display */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          
          {/* ======================================================== */}
          {/* DRIVER TABS                                              */}
          {/* ======================================================== */}
          {currentUser.role === 'DRIVER' && (
            <>
              {activeTab === 'deliveries' && (
                <DriverView
                  actor={currentUser}
                  token={currentUser.id}
                  orders={orders}
                  onRefresh={fetchOrders}
                />
              )}

              {activeTab === 'delivered_history' && (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Livraisons Clôturées</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Preuves photographiques certifiées avec empreinte SHA-256</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-[#1ea844]/15 text-[#1ea844] font-bold text-xs border border-[#1ea844]/30">
                      {orders.filter(o => o.operationalStatus === 'LIVRE').length} livrée(s)
                    </span>
                  </div>

                  {orders.filter(o => o.operationalStatus === 'LIVRE').length === 0 ? (
                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs">
                      Aucune livraison terminée pour le moment.
                    </div>
                  ) : (
                    orders.filter(o => o.operationalStatus === 'LIVRE').map(o => (
                      <div key={o.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 dark:text-white text-base">{o.orderNumber}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#1ea844]/15 text-[#1ea844] text-xs font-bold border border-[#1ea844]/30">
                            LIVRÉ CERTIFIÉ
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          <div className="font-bold text-slate-900 dark:text-slate-200">{o.clientName}</div>
                          <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#e11d2a]" />
                            {o.destinationCity} ({o.postalCode})
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">Documents : {o.dtNumber} • {o.bcNumber}</div>
                        </div>
                        <button
                          onClick={() => setSelectedProofOrder(o)}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1ea844] text-xs font-bold flex items-center justify-center gap-1.5 transition border border-[#1ea844]/30 cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#1ea844]" />
                          <span>Consulter la preuve photo certifiée</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'driver_info' && (
                <div className="max-w-md mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xl">
                  <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="w-14 h-14 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center font-extrabold text-xl border border-[#e11d2a]/30">
                      🚛
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">{currentUser.name}</h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">{currentUser.email}</span>
                      <span className="text-[11px] text-[#1ea844] font-bold">Conducteur Agréé AIA Aliments</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Identifiant Chauffeur :</span>
                      <strong className="font-mono text-slate-900 dark:text-white">{currentUser.driverId}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Permis de Conduire :</span>
                      <strong className="font-mono text-slate-900 dark:text-white">{driverProfile?.licenseNumber || 'PERM-FR-849301'}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Véhicule Affecté :</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{driverProfile?.vehiclePlate || 'EX-921-TK'}</strong>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Téléphone de Contact :</span>
                      <strong className="text-slate-900 dark:text-white">{driverProfile?.phone || '+33 6 12 34 56 78'}</strong>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* CARRIER TABS                                             */}
          {/* ======================================================== */}
          {currentUser.role === 'CARRIER' && (
            <>
              {(activeTab === 'orders' || activeTab === 'drivers') && (
                <CarrierView
                  actor={currentUser}
                  token={currentUser.id}
                  orders={orders}
                  onRefresh={fetchOrders}
                />
              )}

              {activeTab === 'security_status' && (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-[#1ea844]/40 space-y-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Cloisonnement Multi-Tenant AIA</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Votre compte est hermétiquement isolé sous le Tenant ID #{currentUser.carrierId}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      L'architecture DevSecOps AIA LogiTrack garantit qu'aucun autre transporteur ni chauffeur externe ne peut accéder à vos commandes, vos tournées ou vos clients d'aliments.
                    </p>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-[#1ea844] font-bold">
                      Isolation IDOR : VALIDÉE (Accès aux ressources externes bloqué côté serveur avec code HTTP 403 Forbidden).
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ======================================================== */}
          {/* LOGISTICS TABS                                           */}
          {/* ======================================================== */}
          {currentUser.role === 'LOGISTICS' && (
            <LogisticsView
              token={currentUser.id}
              orders={orders}
              onRefresh={fetchOrders}
              onOpenAudit={openAuditWithOrder}
              initialTab={activeTab}
            />
          )}

          {/* ======================================================== */}
          {/* ADMIN TABS                                               */}
          {/* ======================================================== */}
          {currentUser.role === 'ADMIN' && (
            <>
              {activeTab === 'dashboard' ? (
                <AnalyticsDashboard orders={orders} />
              ) : activeTab === 'settings' ? (
                <SettingsView
                  token={currentUser.id}
                  currentUser={currentUser}
                  onRefreshOrders={fetchOrders}
                  onNavigateToOrders={() => setActiveTab('orders')}
                />
              ) : activeTab === 'security' ? (
                <SecurityTestPanel token={currentUser.id} />
              ) : activeTab === 'audit' ? (
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 text-center shadow-lg max-w-xl mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center mx-auto">
                    <History className="w-7 h-7" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Grand Livre d'Audit Immuable AIA</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Consultez l'historique complet et inaltérable des événements opérationnels et de sécurité.</p>
                  <button
                    onClick={() => openAuditWithOrder()}
                    className="px-6 py-3.5 rounded-2xl bg-[#e11d2a] hover:bg-[#b91c1c] !text-white font-extrabold text-xs transition shadow-md cursor-pointer"
                  >
                    Ouvrir le Registre d'Audit Complet
                  </button>
                </div>
              ) : (
                <AdminView
                  token={currentUser.id}
                  orders={orders}
                  onRefresh={fetchOrders}
                  onOpenAudit={openAuditWithOrder}
                />
              )}
            </>
          )}

        </main>

      </div>

      {/* Global Audit Log Drawer */}
      <AuditLogDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        token={currentUser.id}
        initialOrderId={auditTargetOrderId}
      />

      {/* Proof Modal */}
      {selectedProofOrder && (
        <ProofModal
          order={selectedProofOrder}
          isOpen={true}
          onClose={() => setSelectedProofOrder(null)}
          token={currentUser.id}
        />
      )}

    </div>
  );
}
