import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Download, MapPin, Calendar, UserCheck, Hash, ExternalLink } from 'lucide-react';
import type { DeliveryProof, Order } from '../types/index.ts';

interface Props {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export const ProofModal: React.FC<Props> = ({ order, isOpen, onClose, token }) => {
  const [proof, setProof] = useState<DeliveryProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setProof(null);
      return;
    }

    const fetchProof = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${order.id}/proof`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Preuve non trouvée ou accès refusé.');
        }
        const data = await res.json();
        setProof(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };

    fetchProof();
  }, [isOpen, order.id, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Preuve de Livraison Certifiée AIA</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Commande {order.orderNumber} • Client: {order.clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-[#1ea844] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Récupération de la preuve certifiée...</p>
            </div>
          ) : error || !proof ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
              <p>{error || 'Aucune preuve de livraison pour cette commande.'}</p>
            </div>
          ) : (
            <>
              {/* Photo Display */}
              <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 relative group flex items-center justify-center">
                <img
                  src={`/api/proofs/${proof.id}/file`}
                  alt="Preuve de livraison"
                  className="max-h-[380px] w-full object-contain"
                />
                <a
                  href={`/api/proofs/${proof.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-xs font-semibold text-white border border-slate-700 backdrop-blur-md flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ouvrir en grand</span>
                </a>
              </div>

              {/* Security & Integrity Fingerprint */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1ea844]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Empreinte cryptographique d'intégrité (SHA-256)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80">
                  <code className="text-[11px] font-mono text-slate-800 dark:text-slate-300 break-all select-all block">
                    {proof.sha256Hash}
                  </code>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cette empreinte unique garantit l'inviolabilité de la photo : toute falsification du fichier invaliderait instantanément cette clé de contrôle.
                </p>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/70 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#e11d2a] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Horodatage serveur certifié</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {new Date(proof.serverReceivedAt).toLocaleString('fr-FR')} (UTC)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/70 flex items-start gap-2.5">
                  <UserCheck className="w-4 h-4 text-[#1ea844] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Chauffeur opérateur</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">ID: {proof.driverId}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/70 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Localisation GPS</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {proof.gpsLatitude && proof.gpsLongitude ? (
                        <a
                          href={`https://maps.google.com/?q=${proof.gpsLatitude},${proof.gpsLongitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-[#e11d2a]"
                        >
                          {proof.gpsLatitude}, {proof.gpsLongitude} (±{proof.gpsAccuracy}m)
                        </a>
                      ) : (
                        'Non communiquée'
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/70 flex items-start gap-2.5">
                  <Hash className="w-4 h-4 text-[#e11d2a] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Documents associés</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{order.dtNumber} • {order.bcNumber}</span>
                  </div>
                </div>
              </div>

              {/* Watermark Banner */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Format : {proof.mimeType} ({Math.round(proof.fileSizeBytes / 1024)} Ko)</span>
                <span className="font-mono text-[10px]">{proof.fileName}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500">Stockage privé sécurisé AIA LogiTrack</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
