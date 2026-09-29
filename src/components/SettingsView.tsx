import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Save, 
  Trash2, 
  Edit3, 
  Plus, 
  Search, 
  Lock, 
  Eye, 
  EyeOff, 
  Terminal, 
  ArrowRight, 
  Activity, 
  Check, 
  X, 
  Sliders, 
  Download, 
  Code2, 
  Truck, 
  UserCheck, 
  ShieldCheck,
  RotateCcw,
  Layers,
  Sparkles
} from 'lucide-react';
import type { 
  User, 
  UserRole, 
  Carrier, 
  SapConnectionConfig, 
  SapDriverType, 
  SapQueryPreset, 
  SapQueryResult 
} from '../types/index.ts';
import { feedback } from '../utils/soundAndVibrate';

interface Props {
  token: string;
  currentUser: User;
  onRefreshOrders?: () => void;
  onNavigateToOrders?: () => void;
}

export const SettingsView: React.FC<Props> = ({
  token,
  currentUser,
  onRefreshOrders,
  onNavigateToOrders
}) => {
  // Navigation between the two requested tabs
  const [activeMainTab, setActiveMainTab] = useState<'users' | 'sap'>('users');

  // --------------------------------------------------------------------------
  // TAB 1: USERS STATE & HANDLERS
  // --------------------------------------------------------------------------
  const [users, setUsers] = useState<User[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');

  // User modal state (Create / Edit)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'LOGISTICS' as UserRole,
    carrierId: '',
    driverId: '',
    active: true
  });
  const [savingUser, setSavingUser] = useState(false);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  // User feedback banner
  const [userToast, setUserToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchCarriers = async () => {
    try {
      const res = await fetch('/api/carriers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCarriers(data);
      }
    } catch (e) {
      console.error('Failed to fetch carriers', e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCarriers();
  }, [token]);

  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      role: 'LOGISTICS',
      carrierId: carriers[0]?.id || '',
      driverId: '',
      active: true
    });
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      carrierId: u.carrierId || carriers[0]?.id || '',
      driverId: u.driverId || '',
      active: u.active
    });
    setUserModalError(null);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      setUserModalError('Le nom et l\'adresse email sont obligatoires.');
      return;
    }

    setSavingUser(true);
    setUserModalError(null);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload = {
        name: userFormData.name.trim(),
        email: userFormData.email.trim().toLowerCase(),
        role: userFormData.role,
        carrierId: (userFormData.role === 'CARRIER' || userFormData.role === 'DRIVER') ? userFormData.carrierId : undefined,
        driverId: userFormData.role === 'DRIVER' ? userFormData.driverId : undefined,
        active: userFormData.active
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement de l\'utilisateur.');
      }

      feedback.playSuccessSound();
      setUserToast({
        type: 'success',
        message: editingUser ? `Utilisateur ${data.name} mis à jour avec succès.` : `Nouvel utilisateur ${data.name} créé.`
      });
      setIsUserModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      feedback.playErrorSound();
      const message = err instanceof Error ? err.message : 'Erreur inattendue';
      setUserModalError(message);
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUser = async (u: User) => {
    try {
      const res = await fetch(`/api/users/${u.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !u.active })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du changement de statut.');
      }
      feedback.playSuccessSound();
      setUserToast({
        type: 'success',
        message: `Compte ${u.name} ${!u.active ? 'activé' : 'désactivé'}.`
      });
      setUsers(prev => prev.map(item => item.id === u.id ? { ...item, active: !u.active } : item));
    } catch (err: unknown) {
      feedback.playErrorSound();
      const message = err instanceof Error ? err.message : 'Impossible de modifier le statut';
      setUserToast({ type: 'error', message });
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (!window.confirm(`Confirmez-vous la suppression définitive du compte de "${u.name}" ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression.');
      }
      feedback.playSuccessSound();
      setUserToast({ type: 'success', message: `Utilisateur ${u.name} supprimé.` });
      setUsers(prev => prev.filter(item => item.id !== u.id));
    } catch (err: unknown) {
      feedback.playErrorSound();
      const message = err instanceof Error ? err.message : 'Erreur suppression';
      setUserToast({ type: 'error', message });
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // --------------------------------------------------------------------------
  // TAB 2: SAP SQL CONNECTION & QUERY STATE & HANDLERS
  // --------------------------------------------------------------------------
  const [sapConfig, setSapConfig] = useState<SapConnectionConfig>({
    driver: 'SAP_HANA',
    host: 'sap-hana.aia.atlas.internal',
    port: 30015,
    databaseName: 'HDB_AIA',
    schema: 'SAPABAP1',
    username: 'SAP_LOGITRACK_RO',
    password: '••••••••••••',
    ssl: true,
    poolSize: 10,
    timeoutSeconds: 15,
    autoSyncEnabled: true,
    autoSyncIntervalMinutes: 30
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingSapConfig, setSavingSapConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    serverVersion?: string;
    message: string;
    testedAt?: string;
  } | null>(null);

  // SQL Query Placement & Execution
  const [sqlQuery, setSqlQuery] = useState<string>(`SELECT 
  LIKP.VBELN AS orderNumber,
  LIKP.BSTNK AS bcNumber,
  LIKP.BOLNR AS dtNumber,
  LIKP.LFDAT AS deliveryDate,
  KNA1.NAME1 AS clientName,
  KNA1.STRAS AS deliveryAddress,
  KNA1.ORT01 AS destinationCity,
  KNA1.PSTLZ AS postalCode,
  KNA1.TELF1 AS destinationPhone,
  LIPS.ARKTX AS cargoDescription,
  CAST(LIPS.LFIMG AS DECIMAL(10,2)) AS weightKg,
  LIKP.TDLNR AS carrierCode
FROM SAPABAP1.LIKP AS LIKP
INNER JOIN SAPABAP1.LIPS AS LIPS ON LIKP.VBELN = LIPS.VBELN
INNER JOIN SAPABAP1.KNA1 AS KNA1 ON LIKP.KUNNR = KNA1.KUNNR
WHERE LIKP.LFART IN ('LF', 'NL')
  AND LIKP.WADAT >= CURRENT_DATE - 7
ORDER BY LIKP.ERDAT DESC;`);

  const [queryPresets, setQueryPresets] = useState<SapQueryPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('qry_likp_lips');
  const [executingQuery, setExecutingQuery] = useState(false);
  const [queryResult, setQueryResult] = useState<SapQueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [importingOrders, setImportingOrders] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Fetch SAP config & presets
  const fetchSapSettings = async () => {
    try {
      const [cfgRes, qryRes] = await Promise.all([
        fetch('/api/settings/sap', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/settings/sap/queries', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setSapConfig(cfg);
        if (cfg.lastTestedAt) {
          setConnectionTestResult({
            success: cfg.lastTestStatus === 'SUCCESS',
            message: cfg.lastTestMessage || 'Connexion établie avec succès',
            serverVersion: cfg.serverVersion,
            testedAt: cfg.lastTestedAt
          });
        }
      }
      if (qryRes.ok) {
        const presets = await qryRes.json();
        setQueryPresets(presets);
      }
    } catch (e) {
      console.error('Failed to load SAP settings', e);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'sap') {
      fetchSapSettings();
    }
  }, [activeMainTab, token]);

  const handleSaveSapConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSapConfig(true);
    try {
      const res = await fetch('/api/settings/sap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(sapConfig)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur d\'enregistrement');
      feedback.playSuccessSound();
      setSapConfig(data);
      setConnectionTestResult({
        success: true,
        message: 'Paramètres de connexion SAP enregistrés avec succès.',
        testedAt: new Date().toISOString()
      });
    } catch (err: unknown) {
      feedback.playErrorSound();
      const message = err instanceof Error ? err.message : 'Erreur';
      setConnectionTestResult({
        success: false,
        message: `Erreur d'enregistrement : ${message}`
      });
    } finally {
      setSavingSapConfig(false);
    }
  };

  const handleTestSapConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const res = await fetch('/api/settings/sap/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          host: sapConfig.host,
          port: sapConfig.port,
          driver: sapConfig.driver,
          databaseName: sapConfig.databaseName,
          schema: sapConfig.schema
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Échec du test de connexion SAP.');
      }
      feedback.playSuccessSound();
      setConnectionTestResult({
        success: true,
        latencyMs: data.latencyMs,
        serverVersion: data.serverVersion,
        message: data.message,
        testedAt: data.testedAt
      });
    } catch (err: unknown) {
      feedback.playErrorSound();
      const message = err instanceof Error ? err.message : 'Connexion impossible';
      setConnectionTestResult({
        success: false,
        message
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSelectPreset = (preset: SapQueryPreset) => {
    setSelectedPresetId(preset.id);
    setSqlQuery(preset.sql);
    setQueryResult(null);
    setQueryError(null);
    setImportSuccessMessage(null);
  };

  const handleExecuteSqlQuery = async () => {
    if (!sqlQuery.trim()) {
      setQueryError('Veuillez entrer une requête SQL à exécuter.');
      return;
    }
    setExecutingQuery(true);
    setQueryError(null);
    setQueryResult(null);
    setImportSuccessMessage(null);

    try {
      const res = await fetch('/api/settings/sap/execute-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sql: sqlQuery })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'exécution de la requête SQL.');
      }
      feedback.playSuccessSound();
      setQueryResult(data);
    } catch (err: unknown) {
      feedback.playErrorSound();
      const message = err instanceof Error ? err.message : 'Erreur SQL';
      setQueryError(message);
    } finally {
      setExecutingQuery(false);
    }
  };

  const handleImportQueryData = async () => {
    if (!queryResult || queryResult.rows.length === 0) return;
    setImportingOrders(true);
    setImportSuccessMessage(null);

    try {
      const res = await fetch('/api/settings/sap/import-query-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rows: queryResult.rows })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de l\'import des commandes.');
      }
      feedback.playSuccessSound();
      setImportSuccessMessage(`${data.importedCount} commandes importées avec succès dans LogiTrack.`);
      if (onRefreshOrders) {
        onRefreshOrders();
      }
    } catch (err: unknown) {
      feedback.playErrorSound();
      const message = err instanceof Error ? err.message : 'Erreur import';
      setQueryError(message);
    } finally {
      setImportingOrders(false);
    }
  };

  const handleSaveCurrentQueryPreset = async () => {
    const name = window.prompt('Nom du modèle de requête SQL :', `Extraction SAP personnalisée (${new Date().toLocaleDateString('fr-FR')})`);
    if (!name) return;

    try {
      const res = await fetch('/api/settings/sap/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          category: 'Personnalisé',
          description: 'Requête d\'extraction enregistrée par l\'administrateur',
          sql: sqlQuery
        })
      });
      const saved = await res.json();
      if (res.ok) {
        feedback.playSuccessSound();
        setQueryPresets(prev => [...prev, saved]);
        setSelectedPresetId(saved.id);
        alert('Modèle de requête enregistré avec succès.');
      }
    } catch (e) {
      console.error('Failed to save query preset', e);
    }
  };

  // Helper styles
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-[#e11d2a]/15 text-[#e11d2a] border-[#e11d2a]/30';
      case 'LOGISTICS': return 'bg-[#1ea844]/15 text-[#1ea844] border-[#1ea844]/30';
      case 'CARRIER': return 'bg-[#1ea844]/15 text-[#1ea844] border-[#1ea844]/30';
      case 'DRIVER': return 'bg-[#e11d2a]/15 text-[#e11d2a] border-[#e11d2a]/30';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#e11d2a]/10 text-[#e11d2a] border border-[#e11d2a]/20">
              Administration Système AIA
            </span>
            <span className="text-slate-400 dark:text-slate-600 text-xs">·</span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Paramètres & Connecteurs</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Paramètres & Intégration Base SAP
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Gérez les habilitations utilisateurs et configurez le connecteur SQL direct avec l'ERP SAP d'Agro Industrielle Al Atlas pour l'extraction automatique des expéditions d'aliments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start md:self-auto shrink-0 shadow-inner">
          <button
            onClick={() => setActiveMainTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'users'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className={`w-4 h-4 ${activeMainTab === 'users' ? 'text-[#e11d2a]' : 'text-slate-400'}`} />
            <span>Utilisateurs (CRUD)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('sap')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
              activeMainTab === 'sap'
                ? 'bg-[#e11d2a] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Connexion Base SAP & Requête SQL</span>
            {sapConfig.lastTestStatus === 'SUCCESS' && (
              <span className="w-2 h-2 rounded-full bg-[#1ea844] animate-pulse" title="SAP Connecté" />
            )}
          </button>
        </div>
      </div>

      {/* Global Toast Message */}
      {userToast && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-bold transition animate-in fade-in ${
          userToast.type === 'success' 
            ? 'bg-[#1ea844]/10 border-[#1ea844]/30 text-[#1ea844]'
            : 'bg-red-500/10 border-red-500/30 text-red-500'
        }`}>
          <div className="flex items-center gap-2.5">
            {userToast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{userToast.message}</span>
          </div>
          <button onClick={() => setUserToast(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 1: GESTION DES UTILISATEURS DU SYSTÈME                            */}
      {/* ==================================================================== */}
      {activeMainTab === 'users' && (
        <div className="space-y-6">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Total Utilisateurs</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{users.length}</span>
                <Users className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#e11d2a] block mb-1">Administrateurs</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#e11d2a] font-mono">
                  {users.filter(u => u.role === 'ADMIN').length}
                </span>
                <ShieldCheck className="w-5 h-5 text-[#e11d2a]/50" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1ea844] block mb-1">Logistique & Exploitation</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[#1ea844] font-mono">
                  {users.filter(u => u.role === 'LOGISTICS').length}
                </span>
                <Activity className="w-5 h-5 text-[#1ea844]/50" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Transporteurs & Chauffeurs</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">
                  {users.filter(u => u.role === 'CARRIER' || u.role === 'DRIVER').length}
                </span>
                <Truck className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou transporteur..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#e11d2a]"
              />
              {userSearch && (
                <button
                  onClick={() => setUserSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 'ADMIN', 'LOGISTICS', 'CARRIER', 'DRIVER'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer ${
                    roleFilter === role
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  {role === 'ALL' ? 'Tous' : role}
                </button>
              ))}

              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

              {/* Add User Button */}
              <button
                onClick={handleOpenCreateUser}
                className="px-4 py-2 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-sm ml-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvel Utilisateur</span>
              </button>
            </div>

          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Rôle & Permissions</th>
                    <th className="py-3 px-4">Tenant / Affectation</th>
                    <th className="py-3 px-4">Créé le</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <span>Aucun utilisateur ne correspond aux filtres.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const carrierObj = carriers.find(c => c.id === u.carrierId);
                      const isSelf = u.id === currentUser.id;

                      return (
                        <tr 
                          key={u.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition group"
                        >
                          {/* Name & Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold flex items-center justify-center text-xs border border-slate-200 dark:border-slate-700">
                                {u.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <span className="font-extrabold text-slate-900 dark:text-white block truncate flex items-center gap-1.5">
                                  {u.name}
                                  {isSelf && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/30">
                                      Vous
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate block">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(u.role)}`}>
                              {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                              {u.role === 'LOGISTICS' && <Layers className="w-3 h-3" />}
                              {u.role === 'CARRIER' && <Truck className="w-3 h-3" />}
                              {u.role === 'DRIVER' && <UserCheck className="w-3 h-3" />}
                              <span>{u.role}</span>
                            </span>
                          </td>

                          {/* Tenant / Carrier Assignment */}
                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            {carrierObj ? (
                              <div className="flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{carrierObj.name}</span>
                              </div>
                            ) : u.role === 'CARRIER' || u.role === 'DRIVER' ? (
                              <span className="font-mono text-[11px] text-slate-400">#{u.carrierId || 'Non assigné'}</span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Siège AIA Central</span>
                            )}
                          </td>

                          {/* Created date */}
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>

                          {/* Status toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleToggleUser(u)}
                              disabled={isSelf}
                              title={isSelf ? 'Vous ne pouvez pas désactiver votre propre compte' : (u.active ? 'Désactiver le compte' : 'Activer le compte')}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                u.active
                                  ? 'bg-[#1ea844]/10 text-[#1ea844] border-[#1ea844]/30 hover:bg-[#1ea844]/20'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-[#1ea844]' : 'bg-slate-400'}`} />
                              <span>{u.active ? 'Actif' : 'Inactif'}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                                title="Modifier les informations"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u)}
                                disabled={isSelf || u.id === 'usr_admin'}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isSelf || u.id === 'usr_admin' ? 'Compte administrateur protégé' : 'Supprimer l\'utilisateur'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: CONNEXION SQL AVEC LA BASE SAP & REQUÊTES D'EXTRACTION         */}
      {/* ==================================================================== */}
      {activeMainTab === 'sap' && (
        <div className="space-y-8">
          
          {/* Section 1: Paramètres de Connexion SQL à la Base SAP */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center border border-[#e11d2a]/30">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Connecteur Base de Données SAP
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Protocole SQL natif (ODBC / JDBC / TDS) pour interroger le référentiel des expéditions AIA
                  </p>
                </div>
              </div>

              {/* Ping / Connection status indicator */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSapConnection}
                  disabled={testingConnection}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-[#e11d2a]' : ''}`} />
                  <span>Tester la Connexion SQL</span>
                </button>
              </div>
            </div>

            {/* Connection Test Result Badge */}
            {connectionTestResult && (
              <div className={`p-4 rounded-2xl border text-xs font-medium flex items-start justify-between gap-3 ${
                connectionTestResult.success
                  ? 'bg-[#1ea844]/10 border-[#1ea844]/30 text-[#1ea844]'
                  : 'bg-red-500/10 border-red-500/30 text-red-500'
              }`}>
                <div className="flex items-start gap-2.5">
                  {connectionTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-extrabold block">{connectionTestResult.message}</span>
                    {connectionTestResult.serverVersion && (
                      <span className="text-[11px] font-mono opacity-80 block mt-0.5">
                        Version moteur : {connectionTestResult.serverVersion}
                      </span>
                    )}
                    {connectionTestResult.latencyMs && (
                      <span className="text-[10px] font-mono opacity-70 block mt-0.5">
                        Temps de réponse (Ping DB) : {connectionTestResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                </div>
                {connectionTestResult.testedAt && (
                  <span className="text-[10px] font-mono opacity-60 shrink-0">
                    {new Date(connectionTestResult.testedAt).toLocaleTimeString('fr-FR')}
                  </span>
                )}
              </div>
            )}

            {/* Form Settings */}
            <form onSubmit={handleSaveSapConfig} className="space-y-6">
              
              {/* Database Driver Selector */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-2">
                  Moteur / Pilote Base de Données SAP
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {([
                    { id: 'SAP_HANA', label: 'SAP HANA (HDB)', sub: 'S/4HANA Cloud & On-Prem', port: 30015 },
                    { id: 'SAP_ASE', label: 'SAP ASE / Sybase', sub: 'Adaptive Server Ent.', port: 50000 },
                    { id: 'MSSQL_SBO', label: 'MS SQL Server', sub: 'SAP Business One', port: 1433 },
                    { id: 'ORACLE_SAP', label: 'Oracle Database', sub: 'SAP ECC 6.0 / Enterprise', port: 1521 },
                    { id: 'POSTGRES', label: 'PostgreSQL DW', sub: 'AIA Data Warehouse', port: 5432 }
                  ] as const).map(driverItem => {
                    const isSelected = sapConfig.driver === driverItem.id;
                    return (
                      <button
                        type="button"
                        key={driverItem.id}
                        onClick={() => setSapConfig(prev => ({ ...prev, driver: driverItem.id, port: driverItem.port }))}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#e11d2a]/10 border-[#e11d2a] text-slate-900 dark:text-white shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-xs block">{driverItem.label}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#e11d2a]" />}
                        </div>
                        <span className="text-[10px] text-slate-500 block truncate">{driverItem.sub}</span>
                        <span className="text-[9px] font-mono text-slate-400 block mt-1">Port std : {driverItem.port}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Connection Host, Port, Database, Schema Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Hôte / IP du Serveur SAP *
                  </label>
                  <input
                    type="text"
                    required
                    value={sapConfig.host}
                    onChange={e => setSapConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="ex. sap-hana.aia.atlas.internal"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Port SQL *
                  </label>
                  <input
                    type="number"
                    required
                    value={sapConfig.port}
                    onChange={e => setSapConfig(prev => ({ ...prev, port: Number(e.target.value) }))}
                    placeholder="30015"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Base / SID / Instance SAP *
                  </label>
                  <input
                    type="text"
                    required
                    value={sapConfig.databaseName}
                    onChange={e => setSapConfig(prev => ({ ...prev, databaseName: e.target.value }))}
                    placeholder="HDB_AIA ou AIA_PROD"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Schéma de Données (Schema) *
                  </label>
                  <input
                    type="text"
                    required
                    value={sapConfig.schema}
                    onChange={e => setSapConfig(prev => ({ ...prev, schema: e.target.value }))}
                    placeholder="SAPABAP1 ou AIA_LOGISTICS"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>
              </div>

              {/* Credentials & Security */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Utilisateur SQL SAP (Lecture seule) *
                  </label>
                  <input
                    type="text"
                    required
                    value={sapConfig.username}
                    onChange={e => setSapConfig(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="SAP_LOGITRACK_RO"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Mot de passe SAP *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={sapConfig.password || ''}
                      onChange={e => setSapConfig(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••••••"
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-end space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={sapConfig.ssl}
                      onChange={e => setSapConfig(prev => ({ ...prev, ssl: e.target.checked }))}
                      className="rounded text-[#e11d2a] focus:ring-[#e11d2a] w-4 h-4 cursor-pointer"
                    />
                    <span>Chiffrement SSL / TLS obligatoire</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={sapConfig.autoSyncEnabled}
                      onChange={e => setSapConfig(prev => ({ ...prev, autoSyncEnabled: e.target.checked }))}
                      className="rounded text-[#e11d2a] focus:ring-[#e11d2a] w-4 h-4 cursor-pointer"
                    />
                    <span>Sync automatique toutes les {sapConfig.autoSyncIntervalMinutes || 30} min</span>
                  </label>
                </div>
              </div>

              {/* Submit Config */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingSapConfig}
                  className="px-5 py-2.5 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingSapConfig ? 'Enregistrement...' : 'Enregistrer la Connexion SAP'}</span>
                </button>
              </div>

            </form>

          </div>

          {/* Section 2: ZONE DE PLACEMENT DE LA REQUÊTE SQL SAP */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center border border-[#1ea844]/30">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Placement & Exécution de la Requête SQL SAP
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Écrivez ou collez la requête SQL d'extraction des commandes, adresses et tonnages à importer dans LogiTrack
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSaveCurrentQueryPreset}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                  title="Sauvegarder cette requête comme modèle"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer Modèle</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteSqlQuery}
                  disabled={executingQuery}
                  className="px-4 py-2 rounded-xl bg-[#1ea844] hover:bg-[#168a36] text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${executingQuery ? 'animate-spin' : ''}`} />
                  <span>{executingQuery ? 'Exécution SQL...' : 'Exécuter la Requête SQL'}</span>
                </button>
              </div>
            </div>

            {/* Presets Quick Picker */}
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                Modèles de Requêtes SQL Préconfigurés (1-Click) :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {queryPresets.map(preset => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#1ea844]/10 border-[#1ea844] text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-extrabold text-xs block truncate">{preset.name}</span>
                        <Code2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#1ea844]' : 'text-slate-400'}`} />
                      </div>
                      <span className="text-[10px] text-slate-500 block line-clamp-2">{preset.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SQL Code Textarea with Terminal look */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-md">
              <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="ml-2 font-bold text-slate-300">AIA_SAP_QUERY_EDITOR.sql</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">Lecture seule (SELECT)</span>
                  <span className="text-[10px] font-mono text-[#1ea844]">UTF-8</span>
                </div>
              </div>

              <textarea
                value={sqlQuery}
                onChange={e => setSqlQuery(e.target.value)}
                rows={12}
                placeholder="Entrez votre requête SQL SAP ici (SELECT VBELN, BSTNK, ... FROM LIKP ...)"
                className="w-full p-4 bg-transparent font-mono text-xs leading-relaxed text-emerald-400 placeholder:text-slate-600 focus:outline-none resize-y selection:bg-[#e11d2a] selection:text-white"
                spellCheck={false}
              />
            </div>

            {/* Error Message */}
            {queryError && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{queryError}</span>
              </div>
            )}

            {/* Import Success Message */}
            {importSuccessMessage && (
              <div className="p-4 rounded-2xl bg-[#1ea844]/10 border border-[#1ea844]/30 text-[#1ea844] text-xs font-extrabold flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
                {onNavigateToOrders && (
                  <button
                    onClick={onNavigateToOrders}
                    className="px-3 py-1.5 rounded-xl bg-[#1ea844] text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Voir dans les Commandes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Query Results Data Preview */}
            {queryResult && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#1ea844]" />
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {queryResult.totalRows} enregistrements extraits
                    </span>
                    <span className="text-slate-400 text-xs">·</span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Exécution en {queryResult.executionTimeMs}ms
                    </span>
                  </div>

                  <button
                    onClick={handleImportQueryData}
                    disabled={importingOrders}
                    className="px-4 py-2 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] text-white text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${importingOrders ? 'animate-bounce' : ''}`} />
                    <span>{importingOrders ? 'Import en cours...' : 'Importer dans LogiTrack'}</span>
                  </button>
                </div>

                {/* Table Preview */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase font-mono text-slate-500 dark:text-slate-400">
                      <tr>
                        {queryResult.columns.map(col => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                      {queryResult.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          {queryResult.columns.map(col => (
                            <td key={col} className="py-2.5 px-3 whitespace-nowrap text-slate-800 dark:text-slate-200">
                              {String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ==================================================================== */}
      {/* USER CREATE / EDIT MODAL                                             */}
      {/* ==================================================================== */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Définissez les droits d'accès et l'affectation transporteur
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              
              {userModalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userModalError}</span>
                </div>
              )}

              {/* Name & Email */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Nom Complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={e => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex. Karim El Alami"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Adresse Email Professionnelle *
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={e => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ex. k.elalami@aia.ma"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Rôle Système *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: 'ADMIN', label: 'Administrateur', sub: 'Accès complet & Audit' },
                    { id: 'LOGISTICS', label: 'Logistique', sub: 'Gestion des ordres & ERP' },
                    { id: 'CARRIER', label: 'Transporteur', sub: 'Tenant cloisonné' },
                    { id: 'DRIVER', label: 'Chauffeur', sub: 'Application mobile & Preuves' }
                  ] as const).map(r => {
                    const isSelected = userFormData.role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setUserFormData(prev => ({ ...prev, role: r.id }))}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#e11d2a]/10 border-[#e11d2a] text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-extrabold block">{r.label}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{r.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Carrier Selection (If CARRIER or DRIVER) */}
              {(userFormData.role === 'CARRIER' || userFormData.role === 'DRIVER') && (
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Transporteur Partenaire (Tenant Cloisonné) *
                  </label>
                  <select
                    value={userFormData.carrierId}
                    onChange={e => setUserFormData(prev => ({ ...prev, carrierId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  >
                    {carriers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Active Toggle Switch */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={userFormData.active}
                    onChange={e => setUserFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded text-[#e11d2a] focus:ring-[#e11d2a] w-4 h-4 cursor-pointer"
                  />
                  <span>Compte actif et autorisé à se connecter</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] text-white text-xs font-extrabold transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {savingUser ? 'Enregistrement...' : (editingUser ? 'Mettre à jour' : 'Créer le compte')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
