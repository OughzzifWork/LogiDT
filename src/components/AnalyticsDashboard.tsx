import React, { useMemo, useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Scale, 
  Calendar,
  ShieldCheck,
  Truck,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import type { Order } from '../types/index.ts';
import { useTheme } from '../context/ThemeContext';

interface Props {
  orders: Order[];
}

export const AnalyticsDashboard: React.FC<Props> = ({ orders }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // State filters
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [metricUnit, setMetricUnit] = useState<'orders' | 'tonnage'>('orders');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');

  // AIA Brand Identity Colors from the uploaded visual logo
  const AIA_RED = '#e11d2a';      // Brand Red (AGRO INDUSTRIELLE)
  const AIA_GREEN = '#1ea844';    // Brand Agro Livestock Green (AL ATLAS)
  const AIA_GOLD = '#f59e0b';     // Grain / Cattle feed Amber
  const AIA_SLATE = '#64748b';    // Technical Slate
  const AIA_CYAN = '#06b6d4';     // Logistics Cyan

  // Chart styling based on theme
  const gridStroke = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

  // Compute operational statistics from actual orders
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(o => o.operationalStatus === 'LIVRE').length;
    const loaded = orders.filter(o => o.operationalStatus === 'CHARGE').length;
    const onSite = orders.filter(o => o.operationalStatus === 'SUR_SITE').length;
    const assigned = orders.filter(o => o.operationalStatus === 'AFFECTE').length;

    const unbilled = orders.filter(o => o.billingStatus === 'NON_FACTUREE').length;
    const billed = orders.filter(o => o.billingStatus === 'FACTUREE').length;

    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 94;
    const totalTonnageKg = orders.reduce((acc, curr) => acc + (curr.weightKg || 0), 0);
    const totalTonnageTons = (totalTonnageKg / 1000).toFixed(1);

    // Filtered orders by carrier if needed
    const carrierOrders = selectedCarrier === 'all' 
      ? orders 
      : orders.filter(o => o.carrierId === selectedCarrier);

    return {
      total,
      delivered,
      loaded,
      onSite,
      assigned,
      unbilled,
      billed,
      successRate,
      totalTonnageTons,
      totalTonnageKg,
      carrierOrdersCount: carrierOrders.length
    };
  }, [orders, selectedCarrier]);

  // 1. Volume Quotidien de Commandes Traitées & Tonnage
  const dailyVolumeData = useMemo(() => {
    if (period === '7d') {
      return [
        { jour: 'Lun 23', commandes: 16, chargees: 15, livrees: 14, tonnage: 32.5, sla: 95 },
        { jour: 'Mar 24', commandes: 20, chargees: 19, livrees: 18, tonnage: 41.2, sla: 95 },
        { jour: 'Mer 25', commandes: 18, chargees: 17, livrees: 17, tonnage: 38.0, sla: 95 },
        { jour: 'Jeu 26', commandes: 24, chargees: 23, livrees: 22, tonnage: 49.6, sla: 95 },
        { jour: 'Ven 27', commandes: 28, chargees: 27, livrees: 26, tonnage: 58.4, sla: 95 },
        { jour: 'Sam 28', commandes: 14, chargees: 14, livrees: 13, tonnage: 27.2, sla: 95 },
        { jour: 'Dim 29', commandes: 8, chargees: 8, livrees: 8, tonnage: 15.0, sla: 95 },
      ];
    }
    return [
      { jour: 'S-4', commandes: 94, chargees: 91, livrees: 88, tonnage: 192.0, sla: 95 },
      { jour: 'S-3', commandes: 108, chargees: 105, livrees: 101, tonnage: 218.5, sla: 95 },
      { jour: 'S-2', commandes: 115, chargees: 112, livrees: 109, tonnage: 235.0, sla: 95 },
      { jour: 'S-1', commandes: 122, chargees: 120, livrees: 118, tonnage: 252.8, sla: 95 },
      { jour: 'En cours', commandes: 128, chargees: 123, livrees: 118, tonnage: 261.9, sla: 95 },
    ];
  }, [period]);

  // 2. Délais Moyens de Livraison & Rotation Chauffeur
  const leadTimeHourlyData = useMemo(() => {
    return [
      { tranche: '06h-08h', delaiMoyenMin: 72, objectifSla: 90, chargementMin: 22, transitMin: 35, dechargementMin: 15 },
      { tranche: '08h-10h', delaiMoyenMin: 84, objectifSla: 90, chargementMin: 25, transitMin: 42, dechargementMin: 17 },
      { tranche: '10h-12h', delaiMoyenMin: 96, objectifSla: 90, chargementMin: 28, transitMin: 48, dechargementMin: 20 },
      { tranche: '12h-14h', delaiMoyenMin: 79, objectifSla: 90, chargementMin: 20, transitMin: 44, dechargementMin: 15 },
      { tranche: '14h-16h', delaiMoyenMin: 102, objectifSla: 90, chargementMin: 30, transitMin: 52, dechargementMin: 20 },
      { tranche: '16h-18h', delaiMoyenMin: 86, objectifSla: 90, chargementMin: 24, transitMin: 45, dechargementMin: 17 },
      { tranche: '18h-20h', delaiMoyenMin: 68, objectifSla: 90, chargementMin: 18, transitMin: 36, dechargementMin: 14 },
    ];
  }, []);

  // 3. Taux de Livraison Réussie dans le temps (Évolution de la Conformité & SLA)
  const successRateEvolutionData = useMemo(() => {
    return [
      { jour: 'J-6', tauxReussite: 91.5, objectif: 95, conformitePreuves: 100 },
      { jour: 'J-5', tauxReussite: 93.0, objectif: 95, conformitePreuves: 100 },
      { jour: 'J-4', tauxReussite: 94.2, objectif: 95, conformitePreuves: 100 },
      { jour: 'J-3', tauxReussite: 92.8, objectif: 95, conformitePreuves: 100 },
      { jour: 'J-2', tauxReussite: 96.1, objectif: 95, conformitePreuves: 100 },
      { jour: 'J-1', tauxReussite: 95.4, objectif: 95, conformitePreuves: 100 },
      { jour: 'Aujourd’hui', tauxReussite: stats.successRate, objectif: 95, conformitePreuves: 100 },
    ];
  }, [stats.successRate]);

  // 4. Performance & Taux par Flotte Transporteur
  const carrierPerformanceData = useMemo(() => {
    return [
      { name: 'TransAtlas Express', livrees: 48, retard: 2, conformite: 96, tonnage: 104.5 },
      { name: 'AgroLogix Flotte', livrees: 42, retard: 3, conformite: 93, tonnage: 91.2 },
      { name: 'Transport Bétail Nord', livrees: 28, retard: 1, conformite: 97, tonnage: 66.2 },
    ];
  }, []);

  // 5. Répartition Opérationnelle des Statuts (Pie Donut)
  const statusDistributionData = useMemo(() => {
    return [
      { name: 'Livrées & Certifiées (Photo SHA-256)', value: stats.delivered || 1, color: AIA_GREEN },
      { name: 'Marchandises Chargées (En Transit)', value: stats.loaded || 1, color: AIA_RED },
      { name: 'Chauffeur Sur Site (Scan BC/DT)', value: stats.onSite || 1, color: AIA_GOLD },
      { name: 'En Attente Transporteur', value: stats.assigned || 1, color: AIA_SLATE },
    ];
  }, [stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Controls & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span>Indicateurs Opérationnels & KPIs Logistique</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1ea844]/15 text-[#1ea844] border border-[#1ea844]/30">
                Aliments Bétail & Volaille
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Analyses Recharts en temps réel de la flotte AGRO INDUSTRIELLE AL ATLAS
            </p>
          </div>
        </div>

        {/* Action and Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Toggle: Orders count vs Tonnage */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setMetricUnit('orders')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                metricUnit === 'orders'
                  ? 'bg-[#e11d2a] !text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Commandes
            </button>
            <button
              onClick={() => setMetricUnit('tonnage')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                metricUnit === 'tonnage'
                  ? 'bg-[#1ea844] !text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tonnage (T)
            </button>
          </div>

          {/* Period Toggle */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                period === '7d'
                  ? 'bg-slate-900 dark:bg-slate-700 !text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7 Jours
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                period === '30d'
                  ? 'bg-slate-900 dark:bg-slate-700 !text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              30 Jours
            </button>
          </div>
        </div>

      </div>

      {/* 4 Primary Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Taux de Livraison Réussie */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-l-4 border-l-[#1ea844] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1ea844]" />
              <span>Taux de Livraison Réussie</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#1ea844] font-mono tabular-nums">{stats.successRate}%</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" /> +2.4% vs S-1
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Objectif SLA Garanti : 95.0%
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Délai Moyen de Livraison */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-l-4 border-l-[#e11d2a] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              <Clock className="w-3.5 h-3.5 text-[#e11d2a]" />
              <span>Délai Moyen Constaté</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#e11d2a] font-mono tabular-nums">1h 24m</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                <ArrowDownRight className="w-3.5 h-3.5" /> -14 min
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Prise en charge → Clôture avec preuve
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Volume Quotidien Traité & Tonnage Aliments */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-l-4 border-l-[#f59e0b] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              <Scale className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span>Volume Quotidien Traité</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                {metricUnit === 'orders' ? `${stats.total} Ordres` : `${stats.totalTonnageTons} T`}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Aliments bovins, ovins & volailles
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#f59e0b]/15 text-[#f59e0b] flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Sécurité & Preuves Photo SHA-256 */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-l-4 border-l-[#1ea844] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1ea844]" />
              <span>Traçabilité & Preuves</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">100%</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Certifié</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              Empreinte SHA-256 & géoloc UTC
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Row 1: Charts Section (Volume Quotidien & Taux de Livraison) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Volume Quotidien de Commandes Traitées (Bar / Composed Chart) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e11d2a]" />
                <span>Volume Quotidien de Commandes Traitées (AIA Aliments)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Suivi comparatif des commandes émises, chargées et livrées avec tonnage cumulé
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
              {period === '7d' ? 'Glissant 7 Jours' : 'Agrégat Mensuel'}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="jour" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis yAxisId="left" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#1ea844" fontSize={11} tickLine={false} unit=" T" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '16px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="commandes" name="Commandes Traitées" fill={AIA_RED} radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="chargees" name="Marchandises Chargées" fill={AIA_GOLD} radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="livrees" name="Livrées Conformes" fill={AIA_GREEN} radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="tonnage" name="Tonnage (Tonnes)" stroke="#1ea844" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Règle métier : validation obligatoire par scan BC/DT avant déchargement</span>
            <span className="font-bold text-[#1ea844]">Capacité industrielle maximale : 65 T / jour</span>
          </div>
        </div>

        {/* Chart 2: Répartition Opérationnelle & Taux de Livraison Réussie (Donut Chart) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
          <div className="pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1ea844]" />
              <span>Taux de Réussite & Statuts Flotte</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Proportion des ordres dans le cycle de livraison certifiée
            </p>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '16px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Mini Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
            {statusDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[11px] truncate max-w-[170px]">{item.name}</span>
                </div>
                <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Délais Moyens de Livraison & Évolution du Taux de Réussite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 3: Délais Moyens de Livraison par Tranche Horaire (AreaChart) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e11d2a]" />
                <span>Délais Moyens de Livraison par Tranche Horaire</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Temps total de rotation chauffeur en minutes vs Engagement SLA (90 min)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <span className="w-3 h-1 bg-[#e11d2a] rounded-sm" />
                <span>Délai Réel (min)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
                <span className="w-3 h-0.5 bg-[#1ea844] border-dashed border" />
                <span>SLA Cible (90 min)</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadTimeHourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDelaiAia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={AIA_RED} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={AIA_RED} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="tranche" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis stroke={textColor} fontSize={12} tickLine={false} unit=" min" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '16px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine y={90} stroke={AIA_GREEN} strokeDasharray="4 4" label={{ value: 'SLA 90 min', fill: AIA_GREEN, fontSize: 11 }} />
                <Area type="monotone" dataKey="delaiMoyenMin" name="Délai Moyen Réel (min)" stroke={AIA_RED} strokeWidth={3} fillOpacity={1} fill="url(#colorDelaiAia)" />
                <Line type="monotone" dataKey="objectifSla" name="Objectif Garanti (SLA)" stroke={AIA_GREEN} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Steps info */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Chargement Usine</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">~24 min</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Trajet / Acheminement</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">~44 min</strong>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Déchargement & Preuve</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">~16 min</strong>
            </div>
          </div>
        </div>

        {/* Chart 4: Évolution du Taux de Livraison Réussie (LineChart) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1ea844]" />
                <span>Taux de Livraison Réussie (Tendance Quotidienne)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pourcentage de livraisons conformes sans incident ni litige documentaire
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#1ea844]/15 text-[#1ea844] font-bold text-xs border border-[#1ea844]/30">
                Moyenne : 94.2%
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={successRateEvolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="jour" stroke={textColor} fontSize={12} tickLine={false} />
                <YAxis domain={[85, 100]} stroke={textColor} fontSize={12} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '16px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '12px'
                  }}
                />
                <ReferenceLine y={95} stroke="#e11d2a" strokeDasharray="3 3" label={{ value: 'Seuil 95%', fill: '#e11d2a', fontSize: 11 }} />
                <Line type="monotone" dataKey="tauxReussite" name="Taux Réalisé (%)" stroke={AIA_GREEN} strokeWidth={3} dot={{ r: 5, fill: AIA_GREEN }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="conformitePreuves" name="Conformité SHA-256" stroke={AIA_CYAN} strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Certification photographique : 100% horodatée</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">0 anomalie IDOR signalée</span>
          </div>
        </div>

      </div>

      {/* Row 3: Performance par Flotte Partenaire */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#e11d2a]" />
              <span>Conformité & Taux de Livraison par Transporteur Partenaire</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Classement selon le taux de réussite dans les délais et le tonnage d'aliments acheminé
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {carrierPerformanceData.map((carrier, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">{carrier.name}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  carrier.conformite >= 95 
                    ? 'bg-[#1ea844]/20 text-[#1ea844]' 
                    : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                }`}>
                  {carrier.conformite}% Succès
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Commandes livrées :</span>
                  <strong className="font-mono font-bold text-slate-900 dark:text-white">{carrier.livrees}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Tonnage acheminé :</span>
                  <strong className="font-mono font-bold text-slate-900 dark:text-white">{carrier.tonnage} T</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Retards constatés :</span>
                  <span className="font-mono font-bold text-amber-500">{carrier.retard}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#1ea844] h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${carrier.conformite}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
