import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  ScanBarcode, 
  Camera, 
  CheckCircle2, 
  Clock, 
  Package, 
  FileCheck, 
  ShieldCheck, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import type { Order, User } from '../types/index.ts';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { ProofModal } from './ProofModal';

interface Props {
  actor: User;
  token: string;
  orders: Order[];
  onRefresh: () => void;
}

export const DriverView: React.FC<Props> = ({ actor, token, orders, onRefresh }) => {
  const [activeModal, setActiveModal] = useState<{
    type: 'SCAN_BC' | 'SCAN_DT' | 'CAMERA_DELIVERY' | 'VIEW_PROOF';
    order: Order;
  } | null>(null);

  // Driver orders are already filtered by backend, but we ensure strict UI scoping
  const myOrders = orders.filter(o => o.driverId === actor.driverId);

  // Step 1: Confirm on site with BC
  const handleConfirmOnSite = async (code: string, isManual: boolean) => {
    if (!activeModal) return;
    const res = await fetch(`/api/orders/${activeModal.order.id}/on-site`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ bcInput: code, isManual })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la validation du BC');
    }
    onRefresh();
  };

  // Step 2: Confirm loaded with DT
  const handleConfirmLoaded = async (code: string) => {
    if (!activeModal) return;
    const res = await fetch(`/api/orders/${activeModal.order.id}/loaded`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ dtInput: code })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de la validation du DT');
    }
    onRefresh();
  };

  // Step 3: Confirm delivered with direct camera photo
  const handleConfirmDelivered = async (payload: {
    imageBase64: string;
    mimeType: string;
    gpsLatitude?: number | null;
    gpsLongitude?: number | null;
    gpsAccuracy?: number | null;
    capturedAt: string;
    deviceInfo: string;
  }) => {
    if (!activeModal) return;
    const res = await fetch(`/api/orders/${activeModal.order.id}/delivered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur lors de l’envoi de la preuve');
    }
    onRefresh();
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12 animate-in fade-in duration-150">
      
      {/* Driver mobile status header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e11d2a]/15 text-[#e11d2a] border border-[#e11d2a]/30 flex items-center justify-center font-bold text-lg">
            🚛
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">{actor.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Espace Opérationnel AIA Conducteur</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">À livrer</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#1ea844]/15 text-[#1ea844] border border-[#1ea844]/30">
            {myOrders.filter(o => o.operationalStatus !== 'LIVRE').length} en cours
          </span>
        </div>
      </div>

      {/* Orders List */}
      {myOrders.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Aucune course affectée</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Votre transporteur n'a pas encore affecté de nouvelles commandes d'aliments à votre tournée.
          </p>
        </div>
      ) : (
        myOrders.map((order) => {
          const isDelivered = order.operationalStatus === 'LIVRE';
          const isLoaded = order.operationalStatus === 'CHARGE';
          const isOnSite = order.operationalStatus === 'SUR_SITE';
          const isAssigned = order.operationalStatus === 'AFFECTE';

          return (
            <div
              key={order.id}
              className={`rounded-3xl border transition overflow-hidden shadow-lg ${
                isDelivered
                  ? 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700/80'
              }`}
            >
              {/* Card Header & Operational Progress Bar */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">{order.orderNumber}</span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">({order.dtNumber})</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isDelivered
                      ? 'bg-[#1ea844]/20 text-[#1ea844] border border-[#1ea844]/40'
                      : isLoaded
                      ? 'bg-[#e11d2a]/20 text-[#e11d2a] border border-[#e11d2a]/40'
                      : isOnSite
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {order.operationalStatus === 'AFFECTE' && 'À PRENDRE EN CHARGE'}
                    {order.operationalStatus === 'SUR_SITE' && 'SUR SITE'}
                    {order.operationalStatus === 'CHARGE' && 'CHARGÉ (EN ROUTE)'}
                    {order.operationalStatus === 'LIVRE' && 'LIVRÉ CERTIFIÉ'}
                  </span>
                </div>

                {/* Step indicator pipeline */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className={`h-1.5 rounded-full transition-all ${
                    isOnSite || isLoaded || isDelivered ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                  <div className={`h-1.5 rounded-full transition-all ${
                    isLoaded || isDelivered ? 'bg-[#e11d2a]' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                  <div className={`h-1.5 rounded-full transition-all ${
                    isDelivered ? 'bg-[#1ea844]' : 'bg-slate-200 dark:bg-slate-800'
                  }`} />
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Client Destinataire</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white block">{order.clientName}</span>
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-[#e11d2a] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-medium">{order.deliveryAddress}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">{order.postalCode} {order.destinationCity}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{order.cargoDescription}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{order.packagesCount} colis • {order.weightKg} kg</span>
                </div>

                {/* Mobile Workflow Big Buttons (Step-by-step) */}
                <div className="pt-2 space-y-2.5">
                  {/* Step 1: SUR SITE */}
                  {isAssigned && (
                    <button
                      onClick={() => setActiveModal({ type: 'SCAN_BC', order })}
                      className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 active:scale-95 transition cursor-pointer"
                    >
                      <ScanBarcode className="w-5 h-5 text-slate-950" />
                      <span>ARRIVÉ SUR SITE (SCAN BC)</span>
                    </button>
                  )}

                  {/* Step 2: CHARGÉ */}
                  {isOnSite && (
                    <button
                      onClick={() => setActiveModal({ type: 'SCAN_DT', order })}
                      className="w-full py-4 rounded-2xl bg-[#e11d2a] hover:bg-[#b91c1c] !text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 active:scale-95 transition cursor-pointer"
                    >
                      <ScanBarcode className="w-5 h-5" />
                      <span>MARCHANDISE CHARGÉE (SCAN DT)</span>
                    </button>
                  )}

                  {/* Step 3: LIVRÉ (Direct camera photo) */}
                  {isLoaded && (
                    <button
                      onClick={() => setActiveModal({ type: 'CAMERA_DELIVERY', order })}
                      className="w-full py-4 rounded-2xl bg-[#1ea844] hover:bg-[#15803d] !text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 active:scale-95 transition cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      <span>LIVRAISON : PRENDRE LA PHOTO DU DÉCHARGEMENT</span>
                    </button>
                  )}

                  {/* If completed: View Proof button */}
                  {isDelivered && (
                    <button
                      onClick={() => setActiveModal({ type: 'VIEW_PROOF', order })}
                      className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#1ea844] text-xs font-bold flex items-center justify-center gap-2 transition border border-[#1ea844]/30 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#1ea844]" />
                      <span>Consulter la preuve de livraison certifiée</span>
                    </button>
                  )}

                  {/* Contextual guidance */}
                  {!isDelivered && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-[#e11d2a] flex-shrink-0 mt-0.5" />
                      <div>
                        {isAssigned && "Scannez le Bon de Commande (BC) ou saisissez le numéro pour confirmer votre présence sur site."}
                        {isOnSite && "Scannez le Document de Transport (DT) pour valider le chargement effectif des aliments de bétail/volaille."}
                        {isLoaded && "Prenez une photo nette du déchargement chez le destinataire. La caméra certifiera la livraison avec horodatage et GPS."}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })
      )}

      {/* MODALS */}
      {activeModal?.type === 'SCAN_BC' && (
        <BarcodeScannerModal
          order={activeModal.order}
          mode="BC"
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSuccess={handleConfirmOnSite}
        />
      )}

      {activeModal?.type === 'SCAN_DT' && (
        <BarcodeScannerModal
          order={activeModal.order}
          mode="DT"
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onSuccess={async (code) => {
            await handleConfirmLoaded(code);
          }}
        />
      )}

      {activeModal?.type === 'CAMERA_DELIVERY' && (
        <CameraCaptureModal
          order={activeModal.order}
          actor={actor}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          onConfirmProof={handleConfirmDelivered}
        />
      )}

      {activeModal?.type === 'VIEW_PROOF' && (
        <ProofModal
          order={activeModal.order}
          isOpen={true}
          onClose={() => setActiveModal(null)}
          token={token}
        />
      )}

    </div>
  );
};
