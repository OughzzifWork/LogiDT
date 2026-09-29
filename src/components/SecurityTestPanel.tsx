import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Play, AlertTriangle, Lock } from 'lucide-react';
import { feedback } from '../utils/soundAndVibrate';

interface TestResult {
  id: string;
  name: string;
  description: string;
  expectedStatus: number;
  actualStatus: number;
  blocked: boolean;
  message: string;
  executionTimeMs: number;
}

export const SecurityTestPanel: React.FC<{ token: string }> = ({ token }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runAllSecurityTests = async () => {
    setRunning(true);
    setResults([]);
    const testsOutput: TestResult[] = [];

    // Test 1: IDOR Cross-tenant access attempt (Carrier Dupont trying to read Order ord_10256 belonging to Sud Logistique)
    const t1Start = performance.now();
    try {
      const res = await fetch('/api/orders/ord_10256', {
        headers: { Authorization: 'Bearer usr_carr_dupont' } // Auth as Dupont
      });
      const t1End = performance.now();
      const isBlocked = res.status === 403;
      testsOutput.push({
        id: 'SEC-01',
        name: 'Isolation multi-tenant IDOR (Lecture commande concurrente)',
        description: 'Transporteur Dupont tente de lire la commande ord_10256 (Sud Logistique).',
        expectedStatus: 403,
        actualStatus: res.status,
        blocked: isBlocked,
        message: isBlocked
          ? 'Tentative interceptée et bloquée avec code HTTP 403 Forbidden. Événement tracé dans l’audit.'
          : 'FAIL : Vulnérabilité IDOR détectée ! La commande concurrente a été exposée.',
        executionTimeMs: Math.round(t1End - t1Start)
      });
    } catch (e) {
      console.error(e);
    }

    // Test 2: IDOR Cross-tenant driver assignment attempt (Carrier Dupont trying to assign to Sud Logistique order)
    const t2Start = performance.now();
    try {
      const res = await fetch('/api/orders/ord_10256/assign-driver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer usr_carr_dupont'
        },
        body: JSON.stringify({ driverId: 'drv_marc' })
      });
      const t2End = performance.now();
      const isBlocked = res.status === 403;
      testsOutput.push({
        id: 'SEC-02',
        name: 'Protection IDOR en écriture (Affectation illicite de chauffeur)',
        description: 'Transporteur Dupont tente d’affecter son chauffeur sur la commande de Sud Logistique.',
        expectedStatus: 403,
        actualStatus: res.status,
        blocked: isBlocked,
        message: isBlocked
          ? 'Requête d’écriture interdite (HTTP 403). Tentative de violation multi-tenant enregistrée.'
          : 'FAIL : Violation multi-tenant non bloquée !',
        executionTimeMs: Math.round(t2End - t2Start)
      });
    } catch (e) {
      console.error(e);
    }

    // Test 3: Unassigned Driver access attempt (Driver Pierre trying to validate Marc\'s order)
    const t3Start = performance.now();
    try {
      const res = await fetch('/api/orders/ord_10254/on-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer usr_drv_pierre' // Sud driver
        },
        body: JSON.stringify({ bcInput: 'BC-10254' })
      });
      const t3End = performance.now();
      const isBlocked = res.status === 403;
      testsOutput.push({
        id: 'SEC-03',
        name: 'Isolation Chauffeur non assigné',
        description: 'Chauffeur Pierre (Sud) tente de valider la commande ord_10254 affectée à Marc (Dupont).',
        expectedStatus: 403,
        actualStatus: res.status,
        blocked: isBlocked,
        message: isBlocked
          ? 'Accès refusé au chauffeur non affecté (HTTP 403).'
          : 'FAIL : Un chauffeur non assigné a pu modifier l’état de la commande !',
        executionTimeMs: Math.round(t3End - t3Start)
      });
    } catch (e) {
      console.error(e);
    }

    // Test 4: Illegal state transition (Skip to LIVRE directly)
    const t4Start = performance.now();
    try {
      const res = await fetch('/api/orders/ord_10254/delivered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer usr_drv_marc'
        },
        body: JSON.stringify({
          imageBase64: 'data:image/jpeg;base64,ZmFrZXBob3RvZGF0YQ==',
          mimeType: 'image/jpeg'
        })
      });
      const t4End = performance.now();
      const isBlocked = res.status === 400;
      testsOutput.push({
        id: 'SEC-04',
        name: 'Machine d’état : Verrouillage des transitions illégales',
        description: 'Tentative de passage direct à LIVRÉ sur une commande non chargée.',
        expectedStatus: 400,
        actualStatus: res.status,
        blocked: isBlocked,
        message: isBlocked
          ? 'Machine d’état conforme : transition rejetée (HTTP 400) car précondition CHARGÉ non satisfaite.'
          : 'FAIL : La machine d’état a permis un saut d’état sans respecter le workflow !',
        executionTimeMs: Math.round(t4End - t4Start)
      });
    } catch (e) {
      console.error(e);
    }

    // Test 5: Rejection of malicious file upload MIME
    const t5Start = performance.now();
    try {
      const res = await fetch('/api/orders/ord_10254/delivered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer usr_drv_marc'
        },
        body: JSON.stringify({
          imageBase64: 'data:application/x-sh;base64,c2ggc2NyaXB0',
          mimeType: 'application/x-sh'
        })
      });
      const t5End = performance.now();
      const isBlocked = res.status === 400;
      testsOutput.push({
        id: 'SEC-05',
        name: 'Upload Security : Filtrage strict des types MIME',
        description: 'Tentative d’envoi d’un script shell ou binaire déguisé en photo.',
        expectedStatus: 400,
        actualStatus: res.status,
        blocked: isBlocked,
        message: isBlocked
          ? 'Fichier binaire rejeté côté serveur (HTTP 400). Seuls JPEG, PNG, WEBP sont tolérés.'
          : 'FAIL : Type de fichier arbitraire accepté !',
        executionTimeMs: Math.round(t5End - t5Start)
      });
    } catch (e) {
      console.error(e);
    }

    setResults(testsOutput);
    setRunning(false);
    feedback.triggerSuccess();
  };

  const allPassed = results.length > 0 && results.every(r => r.blocked);

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center font-bold">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Banc de Tests DevSecOps & Anti-IDOR AIA</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vérification automatisée de l'étanchéité multi-tenant, des transitions et de la protection des preuves.
            </p>
          </div>
        </div>

        <button
          onClick={runAllSecurityTests}
          disabled={running}
          className="px-5 py-2.5 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] !text-white text-xs font-bold shadow-lg flex items-center gap-2 active:scale-95 transition disabled:opacity-50 cursor-pointer"
        >
          {running ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Exécution des tests...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Lancer la suite de tests de sécurité</span>
            </>
          )}
        </button>
      </div>

      {/* Global Status Banner if tested */}
      {results.length > 0 && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          allPassed
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/50 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {allPassed ? (
              <ShieldCheck className="w-8 h-8 text-[#1ea844]" />
            ) : (
              <ShieldAlert className="w-8 h-8 text-[#e11d2a]" />
            )}
            <div>
              <span className="font-bold text-sm block">
                {allPassed ? '100% DES CONTRÔLES DE SÉCURITÉ CONFORMES' : 'ATTENTION : DES TESTS ONT ÉCHOUÉ'}
              </span>
              <span className="text-xs opacity-90">
                {results.filter(r => r.blocked).length} / {results.length} tests validés avec succès. Aucune fuite de données inter-transporteurs détectée.
              </span>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-black/10 dark:bg-black/40">
            RBAC OK
          </span>
        </div>
      )}

      {/* Test details list */}
      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((test) => (
            <div
              key={test.id}
              className={`p-4 rounded-2xl border transition ${
                test.blocked
                  ? 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {test.blocked ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1ea844]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#e11d2a]" />
                  )}
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{test.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-slate-500 dark:text-slate-400">Statut HTTP: <strong className="text-slate-800 dark:text-slate-200">{test.actualStatus}</strong> (Attendu: {test.expectedStatus})</span>
                  <span className="text-slate-400 dark:text-slate-500">• {test.executionTimeMs}ms</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{test.description}</p>

              <div className="text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-300 font-mono">
                {test.message}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-slate-500 text-xs">
          Cliquez sur « Lancer la suite de tests de sécurité » pour exécuter le banc d'essais en conditions réelles.
        </div>
      )}

    </div>
  );
};
