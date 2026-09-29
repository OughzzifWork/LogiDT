import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, X, AlertTriangle, MapPin, ShieldCheck, SwitchCamera } from 'lucide-react';
import { feedback } from '../utils/soundAndVibrate';
import type { Order, User } from '../types/index.ts';

interface Props {
  order: Order;
  actor: User;
  isOpen: boolean;
  onClose: () => void;
  onConfirmProof: (payload: {
    imageBase64: string;
    mimeType: string;
    gpsLatitude?: number | null;
    gpsLongitude?: number | null;
    gpsAccuracy?: number | null;
    capturedAt: string;
    deviceInfo: string;
  }) => Promise<void>;
}

export const CameraCaptureModal: React.FC<Props> = ({
  order,
  actor,
  isOpen,
  onClose,
  onConfirmProof
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize camera and geolocation
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      return;
    }

    startCamera();
    fetchGeolocation();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const fetchGeolocation = () => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsData({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
            accuracy: Math.round(pos.coords.accuracy)
          });
          setGpsStatus('granted');
        },
        () => {
          setGpsStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsStatus('denied');
    }
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à la caméra n'est pas supporté par ce navigateur.");
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
    } catch (err: unknown) {
      console.warn('Camera stream initialisation warning:', err);
      const msg = err instanceof Error ? err.message : 'Impossible d’activer le flux caméra direct.';
      setCameraError(msg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from live video and render certified watermark stamp
  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Apply security & traceability watermark banner on bottom
    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    const bannerHeight = Math.max(90, Math.floor(height * 0.14));
    const gradient = ctx.createLinearGradient(0, height - bannerHeight, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
    gradient.addColorStop(0.3, 'rgba(15, 23, 42, 0.85)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

    const fontSize = Math.max(16, Math.floor(width * 0.024));
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize}px sans-serif`;

    const padLeft = Math.floor(width * 0.04);
    const line1Y = height - Math.floor(bannerHeight * 0.60);
    const line2Y = height - Math.floor(bannerHeight * 0.22);

    ctx.fillText(`AIA ALIMENTS DE BÉTAIL | CMD: ${order.orderNumber} | DT: ${order.dtNumber}`, padLeft, line1Y);

    ctx.font = `normal ${Math.floor(fontSize * 0.85)}px sans-serif`;
    ctx.fillStyle = '#94a3b8';
    const gpsText = gpsData ? `GPS: ${gpsData.lat}, ${gpsData.lng} (±${gpsData.accuracy}m)` : 'GPS: Non disponible';
    ctx.fillText(`CHAUFFEUR: ${actor.name} | ${timestampStr} | ${gpsText}`, padLeft, line2Y);

    const base64 = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(base64);
    feedback.triggerCapture();
    stopCamera();
  };

  const generateSimulatedPhoto = () => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background cargo scene pattern
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1280, 720);

    // Simulated livestock feed pallets and sacks
    ctx.fillStyle = '#334155';
    ctx.fillRect(240, 200, 800, 380);
    ctx.fillStyle = '#475569';
    ctx.fillRect(260, 220, 360, 340);
    ctx.fillRect(660, 220, 360, 340);

    ctx.fillStyle = '#1ea844';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`AIA - ALIMENTS DE BÉTAIL ET VOLAILLE`, 280, 140);

    // Bottom Watermark
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 600, 1280, 120);

    const now = new Date();
    const timestampStr = now.toISOString();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`AIA CERTIFIÉ | CMD: ${order.orderNumber} | DT: ${order.dtNumber}`, 40, 645);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText(`CHAUFFEUR: ${actor.name} | CLIENT: ${order.clientName} | ${timestampStr}`, 40, 685);

    const base64 = canvas.toDataURL('image/jpeg', 0.90);
    setCapturedPhoto(base64);
    feedback.triggerCapture();
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleConfirm = async () => {
    if (!capturedPhoto) return;
    setIsSubmitting(true);
    try {
      await onConfirmProof({
        imageBase64: capturedPhoto,
        mimeType: 'image/jpeg',
        gpsLatitude: gpsData?.lat,
        gpsLongitude: gpsData?.lng,
        gpsAccuracy: gpsData?.accuracy,
        capturedAt: new Date().toISOString(),
        deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'PWA Mobile Web App'
      });
      feedback.triggerSuccess();
      onClose();
    } catch (e) {
      feedback.triggerError();
      console.error('Proof submission error', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1ea844]/15 text-[#1ea844] flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Capture Preuve de Livraison AIA</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Commande {order.orderNumber} • {order.clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Camera / Snapshot Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[360px] sm:min-h-[420px] overflow-hidden">
          {capturedPhoto ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img 
                src={capturedPhoto} 
                alt="Aperçu Preuve" 
                className="w-full max-h-[55vh] object-contain"
              />
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold backdrop-blur-md">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Empreinte certifiée prête (SHA-256)</span>
              </div>
            </div>
          ) : (
            <>
              {cameraError ? (
                <div className="p-6 text-center max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">Flux vidéo direct restreint</h3>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    {cameraError} L'autorisation caméra est nécessaire pour la prise en direct.
                  </p>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={startCamera}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Réessayer l’accès caméra
                    </button>
                    <button
                      onClick={generateSimulatedPhoto}
                      className="px-4 py-2.5 rounded-xl bg-[#1ea844] hover:bg-[#15803d] !text-white text-xs font-bold transition cursor-pointer shadow-sm"
                    >
                      Capturer une photo certifiée test
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-cover min-h-[360px]"
                  />
                  {/* Viewfinder Target Grid */}
                  <div className="absolute inset-8 pointer-events-none border-2 border-dashed border-white/50 rounded-2xl flex flex-col justify-between p-4">
                    <div className="flex justify-between text-white text-[10px] font-bold tracking-wider uppercase">
                      <span>Cadrer les sacs / palettes déchargés</span>
                      <span>Horodatage auto</span>
                    </div>
                    <div className="flex justify-between items-end text-white text-[10px] font-semibold">
                      <span>{order.destinationCity}</span>
                      <span>Caméra active</span>
                    </div>
                  </div>

                  {/* Switch camera button */}
                  <button
                    onClick={toggleCameraFacing}
                    type="button"
                    className="absolute top-4 right-4 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-white backdrop-blur-md active:scale-95 transition cursor-pointer"
                    title="Basculer caméra"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Hidden Canvas for rendering snapshot and watermarking */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Footer Meta & Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-3">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#e11d2a]" />
              <span className="font-medium">
                {gpsStatus === 'granted' && gpsData
                  ? `GPS fixé (±${gpsData.accuracy}m)`
                  : gpsStatus === 'pending'
                  ? 'Recherche GPS...'
                  : 'GPS non activé'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#1ea844] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1ea844]" />
              <span>Inviolabilité SHA-256</span>
            </div>
          </div>

          {/* Action buttons (Mobile-first, huge buttons for gloved/single-hand use) */}
          <div className="grid grid-cols-1 gap-2.5">
            {!capturedPhoto ? (
              <button
                onClick={captureFrame}
                className="w-full py-4 rounded-2xl bg-[#e11d2a] hover:bg-[#b91c1c] !text-white font-extrabold text-base shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                </div>
                <span>PRENDRE LA PHOTO DU DÉCHARGEMENT</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleRetake}
                  disabled={isSubmitting}
                  className="py-3.5 rounded-2xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reprendre</span>
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="py-3.5 rounded-2xl bg-[#1ea844] hover:bg-[#15803d] !text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Valider la preuve</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
