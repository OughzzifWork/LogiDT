import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, History, Filter, RefreshCw, FileText, User } from 'lucide-react';
import type { AuditLog } from '../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  initialOrderId?: string;
}

export const AuditLogDrawer: React.FC<Props> = ({ isOpen, onClose, token, initialOrderId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOrderId, setFilterOrderId] = useState(initialOrderId || '');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = filterOrderId
        ? `/api/audit-logs?orderId=${encodeURIComponent(filterOrderId)}`
        : '/api/audit-logs?limit=150';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error('Audit logs fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFilterOrderId(initialOrderId || '');
      fetchLogs();
    }
  }, [isOpen, initialOrderId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e11d2a]/15 text-[#e11d2a] flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white">Grand Livre d'Audit Immuable AIA</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Traçabilité complète des événements opérationnels et de sécurité</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filtrer par ID de commande (ex: ord_10254)..."
              value={filterOrderId}
              onChange={(e) => setFilterOrderId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#e11d2a]"
            />
          </div>
          <button
            onClick={fetchLogs}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#e11d2a]' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-[#e11d2a] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Chargement des événements d'audit...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Aucun événement trouvé pour ces critères.
            </div>
          ) : (
            logs.map((log) => {
              const isSecurity = log.eventType === 'SECURITY_VIOLATION_ATTEMPT';
              const isDelivery = log.eventType === 'DELIVERY_CONFIRMED';
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                    isSecurity
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-500/50 hover:bg-red-100/60 dark:hover:bg-red-900/30'
                      : isDelivery
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/40 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                      isSecurity
                        ? 'bg-red-500/20 text-red-600 dark:text-red-300'
                        : isDelivery
                        ? 'bg-[#1ea844]/20 text-[#1ea844]'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {log.eventType}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('fr-FR')} • {new Date(log.timestamp).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-800 dark:text-slate-300">
                    <span className="font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.actorName} ({log.actorRole})
                    </span>
                    {log.orderId && (
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        CMD Ref: {log.orderId}
                      </span>
                    )}
                  </div>

                  {/* Transition display */}
                  {log.previousStatus && log.newStatus && (
                    <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-900 font-mono font-bold">{log.previousStatus}</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#1ea844]/20 text-[#1ea844] font-mono font-bold">{log.newStatus}</span>
                    </div>
                  )}

                  {/* Details expandable view */}
                  {selectedLog?.id === log.id && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span>IP: <strong className="font-mono text-slate-800 dark:text-slate-300">{log.ipAddress}</strong></span>
                        <span className="truncate max-w-[250px]">Agent: {log.userAgent}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-[10px] text-slate-800 dark:text-slate-300 overflow-x-auto border border-slate-200 dark:border-slate-800">
                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#1ea844]" />
            <span>Registre crypté & immuable (Write-Once-Read-Many)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition font-semibold cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
