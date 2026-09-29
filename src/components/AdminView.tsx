import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Package, 
  Truck, 
  Users, 
  Plus, 
  History, 
  Lock, 
  FilePlus, 
  Search, 
  RefreshCw,
  Building,
  RotateCcw
} from 'lucide-react';
import type { Order, Carrier, Driver, User } from '../types/index.ts';
import { SecurityTestPanel } from './SecurityTestPanel';
import { ProofModal } from './ProofModal';

interface Props {
  token: string;
  orders: Order[];
  onRefresh: () => void;
  onOpenAudit: (orderId?: string) => void;
}

export const AdminView: React.FC<Props> = ({ token, orders, onRefresh, onOpenAudit }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'carriers' | 'security'>('orders');
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);

  // New Order Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [newBcNumber, setNewBcNumber] = useState('');
  const [newDtNumber, setNewDtNumber] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPostal, setNewPostal] = useState('');
  const [newCargo, setNewCargo] = useState('');
  const [newPackages, setNewPackages] = useState(2);
  const [newWeight, setNewWeight] = useState(150);

  // New Carrier Modal
  const [showNewCarrierModal, setShowNewCarrierModal] = useState(false);
  const [carrierCode, setCarrierCode] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [carrierEmail, setCarrierEmail] = useState('');
  const [carrierPhone, setCarrierPhone] = useState('');

  // Reset database state
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchCarriersAndDrivers();
  }, [token]);

  const fetchCarriersAndDrivers = async () => {
    try {
      const [cRes, dRes] = await Promise.all([
        fetch('/api/carriers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/drivers', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (cRes.ok) setCarriers(await cRes.json());
      if (dRes.ok) setDrivers(await dRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderNumber || !newBcNumber || !newDtNumber || !newClientName) return;

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        orderNumber: newOrderNumber,
        bcNumber: newBcNumber,
        dtNumber: newDtNumber,
        clientName: newClientName,
        deliveryAddress: newAddress,
        destinationCity: newCity,
        postalCode: newPostal,
        cargoDescription: newCargo,
        packagesCount: newPackages,
        weightKg: newWeight
      })
    });

    if (res.ok) {
      setShowNewOrderModal(false);
      setNewOrderNumber('');
      setNewBcNumber('');
      setNewDtNumber('');
      setNewClientName('');
      setNewAddress('');
      setNewCity('');
      setNewPostal('');
      setNewCargo('');
      onRefresh();
    }
  };

  const handleCreateCarrier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrierCode || !carrierName) return;

    const res = await fetch('/api/carriers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        code: carrierCode,
        name: carrierName,
        contactEmail: carrierEmail,
        contactPhone: carrierPhone
      })
    });

    if (res.ok) {
      setShowNewCarrierModal(false);
      setCarrierCode('');
      setCarrierName('');
      setCarrierEmail('');
      setCarrierPhone('');
      fetchCarriersAndDrivers();
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('Réinitialiser la base aux données de démonstration d’origine ?')) return;
    setIsResetting(true);
    try {
      await fetch('/api/system/reset', { method: 'POST' });
      fetchCarriersAndDrivers();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Admin Controls Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg">Supervision AIA Aliments / Administrateur</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#e11d2a]/15 text-[#e11d2a] border border-[#e11d2a]/30 font-mono text-[10px] font-bold">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Contrôle global multi-sociétés, audits et conformité DevSecOps</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenAudit()}
            className="px-3.5 py-2 rounded-xl bg-[#1ea844]/15 hover:bg-[#1ea844]/25 text-[#1ea844] text-xs font-bold flex items-center gap-1.5 transition border border-[#1ea844]/30 cursor-pointer shadow-sm"
          >
            <History className="w-4 h-4" />
            <span>Grand Livre d'Audit</span>
          </button>

          <button
            onClick={handleResetDatabase}
            disabled={isResetting}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Réinitialiser l'état initial des commandes"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-[#e11d2a]' : ''}`} />
            <span>Reset Données</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer font-bold ${
            activeTab === 'orders' ? 'bg-[#e11d2a] !text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Toutes les Commandes ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('carriers')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer font-bold ${
            activeTab === 'carriers' ? 'bg-[#e11d2a] !text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Transporteurs & Flottes ({carriers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer font-bold ${
            activeTab === 'security' ? 'bg-[#1ea844] !text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Banc de Tests Sécurité (Anti-IDOR)</span>
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Référentiel des commandes d'aliments
            </h3>
            <button
              onClick={() => setShowNewOrderModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] !text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <FilePlus className="w-4 h-4" />
              <span>Créer une commande</span>
            </button>
          </div>

          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">N° Commande</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">BC / DT</th>
                    <th className="py-3.5 px-4">Transporteur Assigné</th>
                    <th className="py-3.5 px-4">Chauffeur</th>
                    <th className="py-3.5 px-4">Statut Opérationnel</th>
                    <th className="py-3.5 px-4 text-right">Preuve / Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {orders.map((o) => {
                    const carrier = carriers.find(c => c.id === o.carrierId);
                    const driver = drivers.find(d => d.id === o.driverId);
                    const isDelivered = o.operationalStatus === 'LIVRE';

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white font-mono">{o.orderNumber}</td>
                        <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                          <div className="font-semibold">{o.clientName}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{o.destinationCity}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                          <div>{o.bcNumber}</div>
                          <div>{o.dtNumber}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {carrier ? (
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{carrier.name}</span>
                          ) : (
                            <span className="text-amber-500 font-mono text-[11px] font-bold">— Non assigné —</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {driver ? (
                            <span className="text-slate-800 dark:text-slate-200 font-medium">{driver.firstName} {driver.lastName}</span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-[#1ea844]/20 text-[#1ea844] border border-[#1ea844]/40'
                              : o.operationalStatus === 'CHARGE'
                              ? 'bg-[#e11d2a]/20 text-[#e11d2a] border border-[#e11d2a]/40'
                              : o.operationalStatus === 'SUR_SITE'
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {o.operationalStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {isDelivered && (
                            <button
                              onClick={() => setSelectedProofOrder(o)}
                              className="px-2 py-1 rounded bg-[#1ea844]/15 hover:bg-[#1ea844] text-[#1ea844] hover:!text-white font-bold transition cursor-pointer border border-[#1ea844]/30"
                              title="Consulter la photo et hash"
                            >
                              Preuve
                            </button>
                          )}
                          <button
                            onClick={() => onOpenAudit(o.id)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                          >
                            Audit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Carriers */}
      {activeTab === 'carriers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Transporteurs Partenaires & Chauffeurs Enregistrés
            </h3>
            <button
              onClick={() => setShowNewCarrierModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#1ea844] hover:bg-[#15803d] !text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Building className="w-4 h-4" />
              <span>Nouveau Transporteur</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {carriers.map((carrier) => {
              const carrierDrivers = drivers.filter(d => d.carrierId === carrier.id);
              const carrierOrders = orders.filter(o => o.carrierId === carrier.id);

              return (
                <div key={carrier.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">{carrier.name}</h4>
                      <span className="text-xs font-mono text-[#1ea844] font-bold">{carrier.code}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1ea844]/15 text-[#1ea844] border border-[#1ea844]/30 text-xs font-bold">
                      ACTIF
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div>Contact : <strong className="text-slate-800 dark:text-slate-300">{carrier.contactEmail}</strong></div>
                    <div>Téléphone : <strong className="text-slate-800 dark:text-slate-300">{carrier.contactPhone}</strong></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Commandes</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{carrierOrders.length}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Chauffeurs</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">{carrierDrivers.length}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-1">Chauffeurs affiliés :</span>
                    <div className="flex flex-wrap gap-1.5">
                      {carrierDrivers.map(d => (
                        <span key={d.id} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {d.firstName} {d.lastName} ({d.vehiclePlate || 'Véhicule'})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Security Panel */}
      {activeTab === 'security' && (
        <SecurityTestPanel token={token} />
      )}

      {/* Create Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateOrder} className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Création manuelle d'un ordre d'aliments</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">N° Commande *</label>
                <input
                  type="text"
                  required
                  value={newOrderNumber}
                  onChange={e => setNewOrderNumber(e.target.value.toUpperCase())}
                  placeholder="CMD-10260"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">N° BC *</label>
                <input
                  type="text"
                  required
                  value={newBcNumber}
                  onChange={e => setNewBcNumber(e.target.value.toUpperCase())}
                  placeholder="BC-10260"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">N° DT *</label>
                <input
                  type="text"
                  required
                  value={newDtNumber}
                  onChange={e => setNewDtNumber(e.target.value.toUpperCase())}
                  placeholder="DT-10260"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
            </div>

            <div className="text-xs space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Nom Client Destinataire *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Ex: Élevage Ovin & Bovin Atlas"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Ville</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    placeholder="Beni Mellal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Code Postal</label>
                  <input
                    type="text"
                    value={newPostal}
                    onChange={e => setNewPostal(e.target.value)}
                    placeholder="23000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Description Colis / Tonnage Aliments</label>
                <input
                  type="text"
                  value={newCargo}
                  onChange={e => setNewCargo(e.target.value)}
                  placeholder="Aliments complets pour vaches laitières & volaille (15 T)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowNewOrderModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] !text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Créer la commande
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Carrier Modal */}
      {showNewCarrierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form onSubmit={handleCreateCarrier} className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Nouveau Transporteur Partenaire AIA</h3>
            
            <div className="text-xs space-y-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Code Transporteur *</label>
                <input
                  type="text"
                  required
                  value={carrierCode}
                  onChange={e => setCarrierCode(e.target.value.toUpperCase())}
                  placeholder="ATLAS-FRET-04"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Raison Sociale / Nom *</label>
                <input
                  type="text"
                  required
                  value={carrierName}
                  onChange={e => setCarrierName(e.target.value)}
                  placeholder="Transport Aliments Atlas Express"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Email Contact</label>
                <input
                  type="email"
                  value={carrierEmail}
                  onChange={e => setCarrierEmail(e.target.value)}
                  placeholder="contact@atlas-express.ma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Téléphone Contact</label>
                <input
                  type="text"
                  value={carrierPhone}
                  onChange={e => setCarrierPhone(e.target.value)}
                  placeholder="+212 5 22 00 00 00"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowNewCarrierModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#1ea844] hover:bg-[#15803d] !text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                Enregistrer le transporteur
              </button>
            </div>
          </form>
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
