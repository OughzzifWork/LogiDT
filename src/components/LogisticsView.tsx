import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  RefreshCw, 
  ArrowRightLeft, 
  ShieldCheck, 
  Eye, 
  FileText, 
  Truck, 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle, 
  AlertTriangle,
  MapPin,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import type { Order, Carrier, ErpSyncStatus, BillingStatus, OperationalStatus } from '../types/index.ts';
import { ProofModal } from './ProofModal';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface Props {
  token: string;
  orders: Order[];
  onRefresh: () => void;
  onOpenAudit: (orderId?: string) => void;
  initialTab?: string;
}

export const LogisticsView: React.FC<Props> = ({ 
  token, 
  orders, 
  onRefresh, 
  onOpenAudit,
  initialTab = 'dashboard'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'orders' | 'erp'>(
    initialTab === 'dashboard' ? 'dashboard' : initialTab === 'erp' ? 'erp' : 'orders'
  );
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [erpStatus, setErpStatus] = useState<ErpSyncStatus | null>(null);
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCarrierFilter, setSelectedCarrierFilter] = useState('');
  const [selectedOpStatus, setSelectedOpStatus] = useState<string>('');
  const [selectedBillingStatus, setSelectedBillingStatus] = useState<string>('');
  const [filterNonFactureesNonLivrees, setFilterNonFactureesNonLivrees] = useState(
    initialTab === 'unbilled_undelivered'
  );

  // Synchronize when initialTab changes
  useEffect(() => {
    if (initialTab === 'dashboard') setActiveSubTab('dashboard');
    else if (initialTab === 'erp') setActiveSubTab('erp');
    else if (initialTab === 'unbilled_undelivered') {
      setActiveSubTab('orders');
      setFilterNonFactureesNonLivrees(true);
    } else if (initialTab === 'orders') {
      setActiveSubTab('orders');
    }
  }, [initialTab]);

  // Carrier assignment modal
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [targetCarrierId, setTargetCarrierId] = useState('');
  const [isSyncingErp, setIsSyncingErp] = useState(false);

  useEffect(() => {
    fetchCarriers();
    fetchErpStatus();
  }, [token]);

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
      console.error(e);
    }
  };

  const fetchErpStatus = async () => {
    try {
      const res = await fetch('/api/erp/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setErpStatus(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncErp = async () => {
    setIsSyncingErp(true);
    try {
      const res = await fetch('/api/erp/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchErpStatus();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingErp(false);
    }
  };

  const handleExportErp = async () => {
    setIsSyncingErp(true);
    try {
      const res = await fetch('/api/erp/export', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchErpStatus();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingErp(false);
    }
  };

  const handleAssignCarrier = async (orderId: string) => {
    if (!targetCarrierId) return;
    const res = await fetch(`/api/orders/${orderId}/assign-carrier`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ carrierId: targetCarrierId })
    });
    if (res.ok) {
      setAssigningOrder(null);
      setTargetCarrierId('');
      onRefresh();
    }
  };

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (filterNonFactureesNonLivrees) {
      if (o.billingStatus === 'FACTUREE' || o.operationalStatus === 'LIVRE') {
        return false;
      }
    }
    if (selectedCarrierFilter && o.carrierId !== selectedCarrierFilter) {
      return false;
    }
    if (selectedOpStatus && o.operationalStatus !== selectedOpStatus) {
      return false;
    }
    if (selectedBillingStatus && o.billingStatus !== selectedBillingStatus) {
      return false;
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.dtNumber.toLowerCase().includes(q) ||
        o.bcNumber.toLowerCase().includes(q) ||
        o.blFcNumber.toLowerCase().includes(q) ||
        o.clientName.toLowerCase().includes(q) ||
        o.destinationCity.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-fit shadow-sm">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          type="button"
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'dashboard'
              ? 'bg-[#e11d2a] !text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Tableau de Bord & Indicateurs</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          type="button"
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'orders'
              ? 'bg-[#e11d2a] !text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Suivi des Commandes ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('erp')}
          type="button"
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === 'erp'
              ? 'bg-[#e11d2a] !text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Passerelle ERP</span>
        </button>
      </div>

      {/* VIEW 1: RECHARTS ANALYTICS DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <AnalyticsDashboard orders={orders} />
      )}

      {/* VIEW 2: ORDERS MANAGEMENT & TRACKING */}
      {activeSubTab === 'orders' && (
        <div className="space-y-6">
          {/* Top ERP Status Banner & Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-l-4 border-l-[#e11d2a] border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Total Commandes AIA</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{orders.length}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-l-4 border-l-[#f59e0b] border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Non Livrées / En Cours</span>
                <span className="text-2xl font-extrabold text-amber-500">
                  {orders.filter(o => o.operationalStatus !== 'LIVRE').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-l-4 border-l-[#e11d2a] border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Non Facturées</span>
                <span className="text-2xl font-extrabold text-[#e11d2a]">
                  {orders.filter(o => o.billingStatus === 'NON_FACTUREE').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-l-4 border-l-[#1ea844] border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Preuves Certifiées</span>
                <span className="text-2xl font-extrabold text-[#1ea844]">
                  {orders.filter(o => o.operationalStatus === 'LIVRE').length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Text search */}
              <div className="relative md:col-span-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="N° Commande, DT, BC, Ville..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#e11d2a]"
                />
              </div>

              {/* Carrier Filter */}
              <div>
                <select
                  value={selectedCarrierFilter}
                  onChange={(e) => setSelectedCarrierFilter(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                >
                  <option value="">Tous les transporteurs</option>
                  {carriers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Operational Status */}
              <div>
                <select
                  value={selectedOpStatus}
                  onChange={(e) => setSelectedOpStatus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                >
                  <option value="">Tous les statuts livraison</option>
                  <option value="AFFECTE">Affecté</option>
                  <option value="SUR_SITE">Sur site</option>
                  <option value="CHARGE">Chargé</option>
                  <option value="LIVRE">Livré (Preuve certifiée)</option>
                </select>
              </div>

              {/* Quick toggle: Non facturées & Non livrées */}
              <div className="flex items-center">
                <button
                  onClick={() => setFilterNonFactureesNonLivrees(!filterNonFactureesNonLivrees)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    filterNonFactureesNonLivrees
                      ? 'bg-[#e11d2a]/15 border-[#e11d2a]/40 text-[#e11d2a]'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Non Facturées & Non Livrées</span>
                </button>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Commande</th>
                    <th className="py-3.5 px-4">Client / Destination</th>
                    <th className="py-3.5 px-4">Documents (BC / DT)</th>
                    <th className="py-3.5 px-4">Transporteur</th>
                    <th className="py-3.5 px-4">Statut Opérationnel</th>
                    <th className="py-3.5 px-4">Facturation</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        Aucune commande trouvée.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const assignedCarrier = carriers.find(c => c.id === order.carrierId);
                      const isDelivered = order.operationalStatus === 'LIVRE';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-4 px-4">
                            <span className="font-extrabold text-slate-900 dark:text-white block">{order.orderNumber}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{order.blFcNumber}</span>
                          </td>

                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-900 dark:text-slate-200 block">{order.clientName}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{order.destinationCity} ({order.postalCode})</span>
                          </td>

                          <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                            <div>BC: {order.bcNumber}</div>
                            <div>DT: {order.dtNumber}</div>
                          </td>

                          <td className="py-4 px-4">
                            {assignedCarrier ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{assignedCarrier.name}</span>
                              </div>
                            ) : (
                              <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                Non affecté
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${
                              isDelivered
                                ? 'bg-[#1ea844]/20 text-[#1ea844] border border-[#1ea844]/40'
                                : order.operationalStatus === 'CHARGE'
                                ? 'bg-[#e11d2a]/20 text-[#e11d2a] border border-[#e11d2a]/40'
                                : order.operationalStatus === 'SUR_SITE'
                                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}>
                              {order.operationalStatus}
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              order.billingStatus === 'FACTUREE'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                : 'bg-[#e11d2a]/15 text-[#e11d2a] border border-[#e11d2a]/30'
                            }`}>
                              {order.billingStatus}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                assigningOrder ? setAssigningOrder(null) : setAssigningOrder(order);
                                setTargetCarrierId(order.carrierId || '');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#e11d2a] hover:bg-[#b91c1c] !text-white text-xs font-bold transition cursor-pointer shadow-sm"
                              title="Affecter transporteur"
                            >
                              Affecter
                            </button>

                            {isDelivered && (
                              <button
                                onClick={() => setSelectedProofOrder(order)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#1ea844] hover:bg-[#15803d] !text-white text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                                title="Consulter la preuve de livraison"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Preuve</span>
                              </button>
                            )}

                            <button
                              onClick={() => onOpenAudit(order.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer border border-slate-200 dark:border-slate-700"
                              title="Voir l'historique d'audit"
                            >
                              Audit
                            </button>
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

      {/* VIEW 3: ERP GATEWAY */}
      {activeSubTab === 'erp' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center font-bold">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Passerelle ERP Découplée Agro Industrielle Al Atlas</h4>
                  <span className="px-2 py-0.5 rounded-full bg-[#1ea844]/20 text-[#1ea844] font-mono text-[10px] font-bold border border-[#1ea844]/30">
                    CONNECTÉ (SQL READ-ONLY)
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dernière synchronisation des ordres d'aliments : {erpStatus ? new Date(erpStatus.lastSyncAt).toLocaleString('fr-FR') : 'En attente'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              La passerelle d'intégration permet d'importer les bons de commande d'aliments de bétail et volaille depuis la base métier de l'entreprise, et d'exporter automatiquement les clôtures certifiées avec empreinte SHA-256 pour déclencher la facturation client.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={handleSyncErp}
                disabled={isSyncingErp}
                className="px-5 py-3 rounded-2xl bg-[#e11d2a] hover:bg-[#b91c1c] disabled:opacity-50 text-xs font-bold !text-white flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <DownloadCloud className={`w-4 h-4 ${isSyncingErp ? 'animate-bounce' : ''}`} />
                <span>Importer les commandes en attente (ERP)</span>
              </button>
              <button
                onClick={handleExportErp}
                disabled={isSyncingErp}
                className="px-5 py-3 rounded-2xl bg-[#1ea844] hover:bg-[#15803d] disabled:opacity-50 text-xs font-bold !text-white shadow-lg flex items-center gap-2 transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-white" />
                <span>Exporter clôtures & preuves vers la Facturation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Carrier Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Affecter au Transporteur</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Commande : <strong>{assigningOrder.orderNumber}</strong> ({assigningOrder.clientName})
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Transporteur Partenaire</label>
              <select
                value={targetCarrierId}
                onChange={(e) => setTargetCarrierId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
              >
                <option value="">-- Choisir un transporteur --</option>
                {carriers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setAssigningOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!targetCarrierId}
                onClick={() => handleAssignCarrier(assigningOrder.id)}
                className="px-5 py-2 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] disabled:opacity-50 !text-white text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Confirmer l'affectation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {selectedProofOrder && (
        <ProofModal
          order={selectedProofOrder}
          isOpen={true}
          onClose={() => setSelectedProofOrder(null)}
          token={token}
        />
      )}

    </div>
  );
};
