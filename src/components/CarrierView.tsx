import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Users, 
  Package, 
  UserPlus, 
  CheckCircle2, 
  MapPin, 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Plus, 
  ChevronRight,
  Eye
} from 'lucide-react';
import type { Order, User, Driver } from '../types/index.ts';
import { ProofModal } from './ProofModal';

interface Props {
  actor: User;
  token: string;
  orders: Order[];
  onRefresh: () => void;
}

export const CarrierView: React.FC<Props> = ({ actor, token, orders, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers'>('orders');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedProofOrder, setSelectedProofOrder] = useState<Order | null>(null);

  // New Driver Form state
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Driver assignment modal
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await fetch('/api/drivers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrivers(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [token]);

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) return;

    const res = await fetch('/api/drivers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        licenseNumber,
        vehiclePlate
      })
    });

    if (res.ok) {
      setFirstName('');
      setLastName('');
      setPhone('');
      setLicenseNumber('');
      setVehiclePlate('');
      setShowAddDriver(false);
      fetchDrivers();
      onRefresh();
    }
  };

  const handleToggleDriver = async (driverId: string) => {
    await fetch(`/api/drivers/${driverId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchDrivers();
  };

  const handleAssignDriver = async (orderId: string) => {
    if (!selectedDriverId) return;
    const res = await fetch(`/api/orders/${orderId}/assign-driver`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ driverId: selectedDriverId })
    });
    if (res.ok) {
      setAssigningOrder(null);
      setSelectedDriverId('');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Tenant Security Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg">{actor.name}</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#1ea844]/15 border border-[#1ea844]/30 text-[10px] font-bold text-[#1ea844]">
                TENANT #{actor.carrierId}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Périmètre hermétique : vos commandes & votre flotte de transport d'aliments</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer font-bold ${
              activeTab === 'orders'
                ? 'bg-[#e11d2a] !text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Commandes ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition cursor-pointer font-bold ${
              activeTab === 'drivers'
                ? 'bg-[#e11d2a] !text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Chauffeurs ({drivers.length})</span>
          </button>
        </div>
      </div>

      {/* Content depending on active tab */}
      {activeTab === 'orders' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Ordres de transport affectés à votre entreprise
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {orders.filter(o => !o.driverId).length} commande(s) en attente d'affectation chauffeur
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => {
              const assignedDriver = drivers.find(d => d.id === order.driverId);
              const isDelivered = order.operationalStatus === 'LIVRE';

              return (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-lg space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">{order.orderNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Destinataire :</span>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-200">{order.clientName}</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#e11d2a]" />
                        {order.postalCode} {order.destinationCity}
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Documents :</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{order.dtNumber} • {order.bcNumber}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Chargement :</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{order.packagesCount} colis ({order.weightKg} kg)</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Chauffeur affecté :</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {assignedDriver ? `${assignedDriver.firstName} ${assignedDriver.lastName} (${assignedDriver.vehiclePlate || 'Véhicule'})` : '⚠️ Aucun chauffeur'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                    {!isDelivered ? (
                      <button
                        onClick={() => {
                          setAssigningOrder(order);
                          setSelectedDriverId(order.driverId || '');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] !text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>{order.driverId ? 'Changer de chauffeur' : 'Affecter à un chauffeur'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedProofOrder(order)}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1ea844] font-bold text-xs transition flex items-center justify-center gap-1.5 border border-[#1ea844]/40 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir la preuve certifiée</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Drivers Management Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Flotte de Chauffeurs ({actor.name})
            </h3>
            <button
              onClick={() => setShowAddDriver(!showAddDriver)}
              className="px-3.5 py-2 rounded-xl bg-[#1ea844] hover:bg-[#15803d] text-xs font-bold !text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Chauffeur</span>
            </button>
          </div>

          {/* Add Driver Drawer / Form */}
          {showAddDriver && (
            <form onSubmit={handleCreateDriver} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-[#1ea844]/40 space-y-4 shadow-xl animate-in fade-in">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#1ea844]" />
                <span>Enregistrer un nouveau conducteur d'aliments</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Lucas"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Nom *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: Moreau"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Téléphone mobile</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 6 00 00 00 00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Immatriculation Véhicule</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="Ex: AA-123-BB"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a] uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDriver(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#1ea844] hover:bg-[#15803d] !text-white text-xs font-bold cursor-pointer shadow-sm"
                >
                  Créer le chauffeur
                </button>
              </div>
            </form>
          )}

          {/* Drivers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {drivers.map((drv) => (
              <div
                key={drv.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{drv.firstName} {drv.lastName}</span>
                    <button
                      onClick={() => handleToggleDriver(drv.id)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        drv.active
                          ? 'bg-[#1ea844]/20 text-[#1ea844] border border-[#1ea844]/40'
                          : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40'
                      }`}
                    >
                      {drv.active ? 'ACTIF' : 'INACTIF'}
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">{drv.phone || 'Non renseigné'}</span>
                  <div className="mt-2 text-xs font-mono text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    Plaque : <strong>{drv.vehiclePlate || 'N/A'}</strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  ID: {drv.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver Assignment Modal */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Affecter la commande {assigningOrder.orderNumber}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sélectionnez un chauffeur parmi votre équipe de conducteurs agréés AIA.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Chauffeur disponible</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#e11d2a]"
              >
                <option value="">-- Choisir un chauffeur --</option>
                {drivers.filter(d => d.active).map(d => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} ({d.vehiclePlate || 'Véhicule standard'})
                  </option>
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
                disabled={!selectedDriverId}
                onClick={() => handleAssignDriver(assigningOrder.id)}
                className="px-5 py-2 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] disabled:opacity-50 !text-white text-xs font-bold transition cursor-pointer shadow-md"
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
