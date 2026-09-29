import React, { useState } from 'react';
import { 
  Truck, 
  Lock, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Scale,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import type { User } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggleButton } from './ThemeToggleButton';
import { AiaLogo } from './AiaLogo';

interface Props {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginPage: React.FC<Props> = ({ users, onLogin }) => {
  const [customEmail, setCustomEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'quick' | 'credentials'>('quick');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: customEmail.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Identifiants inconnus.');
      }

      const data = await res.json();
      onLogin(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Échec de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const driverUsers = users.filter(u => u.role === 'DRIVER');
  const carrierUsers = users.filter(u => u.role === 'CARRIER');
  const logisticsUsers = users.filter(u => u.role === 'LOGISTICS');
  const adminUsers = users.filter(u => u.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#e11d2a] selection:text-white relative overflow-hidden">
      
      {/* Subtle background ambient mesh */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[360px] bg-gradient-to-b from-[#e11d2a]/10 via-[#1ea844]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
        <AiaLogo variant="full" />

        <div className="flex items-center gap-3">
          <ThemeToggleButton />
          <PWAInstallButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        
        {/* Hero Pitch & Brand Identity */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1ea844]/15 border border-[#1ea844]/30 text-[#1ea844] text-xs font-bold tracking-tight shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#1ea844] animate-pulse" />
            <span>Portail Numérique Logistique & Transport d'Aliments</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Système Central AIA LogiTrack
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Traçabilité intégrale des ordres de transport, dispatch multi-flottes, certification photographique inviolable SHA-256 et passerelle ERP temps réel.
          </p>
        </div>

        {/* Auth Container Card */}
        <div className="max-w-2xl w-full mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          
          {/* Top Segmented Selector */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('quick')}
              className={`py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'quick'
                  ? 'bg-[#e11d2a] !text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Accès Démo Opérationnel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'credentials'
                  ? 'bg-[#e11d2a] !text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Connexion Email Pro</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'quick' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <span>Sélectionnez un profil pour ouvrir son espace dédié :</span>
                  <span className="font-mono text-[11px] text-[#1ea844]">Accès direct sécurisé</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  
                  {/* Role 1: Chauffeur Conducteur */}
                  {driverUsers[0] && (
                    <button
                      key={driverUsers[0].id}
                      onClick={() => onLogin(driverUsers[0])}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/90 hover:border-[#e11d2a]/50 text-left transition flex flex-col justify-between group active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#e11d2a]/5 rounded-bl-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e11d2a]/15 text-[#e11d2a] border border-[#e11d2a]/30">
                            CONDUCTEUR PWA
                          </span>
                          <Smartphone className="w-4 h-4 text-[#e11d2a]" />
                        </div>
                        <strong className="block text-sm font-extrabold text-slate-900 dark:text-white">{driverUsers[0].name}</strong>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                          Interface smartphone : scans BC/DT & capture photo
                        </span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-[#e11d2a]">
                        <span>Démarrer la tournée</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  )}

                  {/* Role 2: Transporteur Partenaire */}
                  {carrierUsers[0] && (
                    <button
                      key={carrierUsers[0].id}
                      onClick={() => onLogin(carrierUsers[0])}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/90 hover:border-[#1ea844]/50 text-left transition flex flex-col justify-between group active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#1ea844]/5 rounded-bl-full pointer-events-none" />
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1ea844]/15 text-[#1ea844] border border-[#1ea844]/30">
                            TRANSPORTEUR PARTENAIRE
                          </span>
                          <Truck className="w-4 h-4 text-[#1ea844]" />
                        </div>
                        <strong className="block text-sm font-extrabold text-slate-900 dark:text-white">{carrierUsers[0].name}</strong>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                          Tenant cloisonné #{carrierUsers[0].carrierId} · Gestion de flotte
                        </span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-[#1ea844]">
                        <span>Affecter les courses</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  )}

                  {/* Role 3: Direction Logistique AIA */}
                  {logisticsUsers[0] && (
                    <button
                      key={logisticsUsers[0].id}
                      onClick={() => onLogin(logisticsUsers[0])}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/90 hover:border-[#e11d2a]/50 text-left transition flex flex-col justify-between group active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            DIRECTION LOGISTIQUE
                          </span>
                          <TrendingUp className="w-4 h-4 text-amber-500" />
                        </div>
                        <strong className="block text-sm font-extrabold text-slate-900 dark:text-white">{logisticsUsers[0].name}</strong>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                          Tableaux Recharts, suivi tonnage & passerelle ERP
                        </span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>Ouvrir les indicateurs</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  )}

                  {/* Role 4: Superviseur Admin AIA */}
                  {adminUsers[0] && (
                    <button
                      key={adminUsers[0].id}
                      onClick={() => onLogin(adminUsers[0])}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800/90 hover:border-[#1ea844]/50 text-left transition flex flex-col justify-between group active:scale-[0.98] cursor-pointer shadow-sm relative overflow-hidden"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1ea844]/15 text-[#1ea844] border border-[#1ea844]/30">
                            ADMINISTRATION AIA
                          </span>
                          <ShieldCheck className="w-4 h-4 text-[#1ea844]" />
                        </div>
                        <strong className="block text-sm font-extrabold text-slate-900 dark:text-white">{adminUsers[0].name}</strong>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                          Audit immuable, conformité DevSecOps & Root
                        </span>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-[#1ea844]">
                        <span>Supervision générale</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                      </div>
                    </button>
                  )}

                </div>
              </div>
            ) : (
              /* Professional Form */
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Adresse email professionnelle :
                  </label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Ex: marc.leclerc@transports-dupont.fr"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#e11d2a]"
                  />
                </div>

                {error && (
                  <div className="p-3.5 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/50 flex items-center gap-2.5 text-xs text-red-800 dark:text-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !customEmail.trim()}
                  className="w-full py-3.5 rounded-2xl bg-[#e11d2a] hover:bg-[#b91c1c] disabled:opacity-50 !text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Accéder au portail LogiTrack</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Security & Multi-tenant Notice */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#1ea844] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-slate-300 block">Environnement Sécurisé Agro Industrielle Al Atlas (AIA) :</strong>
              <span>
                Cloisonnement multi-tenant garanti. Toutes les preuves de livraison sont vérifiées par hachage SHA-256 et horodatées au standard UTC.
              </span>
            </div>
          </div>

        </div>

        {/* 3 Metric Trust Points */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mx-auto mt-6 text-center text-xs">
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="font-extrabold text-sm text-[#e11d2a] font-mono block">65 Tonnes / jour</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Capacité de production & dispatch</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="font-extrabold text-sm text-[#1ea844] font-mono block">100% Certifié SHA-256</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Preuves photographiques inviolables</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono block">SLA 95% Garanti</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Respect contractuel des délais</span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-4 py-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80">
        Agro Industrielle Al Atlas (AIA) • Aliments de Bétail et Volaille • Système Logistique PWA v2.4
      </footer>

    </div>
  );
};
