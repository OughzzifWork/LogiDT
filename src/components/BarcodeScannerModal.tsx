import React, { useEffect, useRef, useState } from 'react';
import { ScanBarcode, Keyboard, X, Check, AlertCircle, Camera, CheckCircle2 } from 'lucide-react';
import { feedback } from '../utils/soundAndVibrate';
import type { Order } from '../types/index.ts';

interface Props {
  order: Order;
  mode: 'BC' | 'DT';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string, isManual: boolean) => Promise<void>;
}

export const BarcodeScannerModal: React.FC<Props> = ({
  order,
  mode,
  isOpen,
  onClose,
  onSuccess
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'detected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const expectedCode = mode === 'BC' ? order.bcNumber : order.dtNumber;
  const title = mode === 'BC' ? 'Scan Bon de Commande (BC)' : 'Scan Document de Transport (DT)';

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setManualCode('');
      setScanStatus('idle');
      setErrorMessage(null);
      return;
    }

    if (activeTab === 'camera') {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, activeTab]);

  const startScanning = async () => {
    stopScanning();
    setErrorMessage(null);
    setScanStatus('idle');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraAvailable(false);
        setActiveTab('manual');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Play warning', e));
      }

      // Check native BarcodeDetector API
      const BarcodeDetectorClass = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
      if (BarcodeDetectorClass) {
        try {
          const barcodeDetector = new BarcodeDetectorClass({
            formats: ['code_128', 'qr_code', 'ean_13', 'code_39', 'data_matrix']
          });

          scanIntervalRef.current = window.setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const detected = barcodes[0].rawValue;
                  handleCodeDetected(detected, false);
                }
              } catch (e) {
                // ignore frame detection drops
              }
            }
          }, 300);
        } catch (e) {
          console.warn('BarcodeDetector instantiation fallback', e);
        }
      }
    } catch (err) {
      console.warn('Camera scan stream unavailable:', err);
      setCameraAvailable(false);
      setActiveTab('manual');
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleCodeDetected = async (code: string, isManual: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      await onSuccess(code, isManual);
      setScanStatus('detected');
      feedback.triggerSuccess();
      stopScanning();
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      feedback.triggerError();
      setScanStatus('error');
      const msg = err instanceof Error ? err.message : 'Code invalide ou ne correspondant pas au document.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim(), true);
  };

  // Quick test fill helper for rapid demonstration
  const handleQuickFill = (codeToUse: string) => {
    setManualCode(codeToUse);
    handleCodeDetected(codeToUse, true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
              mode === 'BC' ? 'bg-amber-500/20 text-amber-500' : 'bg-[#e11d2a]/15 text-[#e11d2a]'
            }`}>
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Commande {order.orderNumber} • Attendu: <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">{expectedCode}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Scan Caméra vs Saisie Manuelle) */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer font-bold ${
              activeTab === 'camera'
                ? 'bg-[#e11d2a] !text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Caméra Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer font-bold ${
              activeTab === 'manual'
                ? 'bg-[#e11d2a] !text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Saisie manuelle</span>
          </button>
        </div>

        {/* Viewport content */}
        <div className="p-5">
          {activeTab === 'camera' ? (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border border-slate-200 dark:border-slate-800">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Reticle */}
              <div className="absolute inset-6 pointer-events-none border-2 border-white/70 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between text-[11px] font-mono text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm self-start">
                  <span>Recherche {mode}...</span>
                </div>

                {/* Animated Laser Scanning Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#e11d2a] to-transparent shadow-[0_0_12px_rgba(225,29,42,0.9)] animate-bounce" />

                <div className="text-[10px] text-center text-white bg-black/60 py-1 rounded">
                  Centrer le code-barres {mode} ou QR dans le cadre
                </div>
              </div>

              {scanStatus === 'detected' && (
                <div className="absolute inset-0 bg-[#1ea844]/80 backdrop-blur-sm flex items-center justify-center text-white animate-in zoom-in-95">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-12 h-12" />
                    <span className="font-bold text-lg">Code validé !</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Entry Form */
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Saisir le numéro du document {mode} ou le n° de commande :
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder={`Ex: ${expectedCode}`}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-3.5 text-base font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#e11d2a] uppercase"
                    autoFocus
                  />
                  <div className="absolute right-3 top-3.5 text-xs text-slate-400 font-mono font-bold">
                    {mode}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!manualCode.trim() || isProcessing}
                className="w-full py-3.5 rounded-xl bg-[#e11d2a] hover:bg-[#b91c1c] disabled:opacity-50 !text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Valider le numéro saisi</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Error notice if mismatch */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/50 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Erreur de vérification</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Quick simulator buttons for testing ease */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-2 font-semibold">Simulation de scan instantané :</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill(expectedCode)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono font-bold text-[#1ea844] border border-[#1ea844]/30 transition cursor-pointer"
              >
                Code conforme ({expectedCode})
              </button>
              {mode === 'BC' && (
                <button
                  type="button"
                  onClick={() => handleQuickFill(order.orderNumber)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-mono font-bold text-[#e11d2a] border border-[#e11d2a]/30 transition cursor-pointer"
                >
                  N° Commande ({order.orderNumber})
                </button>
              )}
              <button
                type="button"
                onClick={() => handleQuickFill('CODE-ERRONE-999')}
                className="px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-xs font-mono text-red-700 dark:text-red-300 border border-red-300 dark:border-red-900/60 transition cursor-pointer"
              >
                Simuler code erroné
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
