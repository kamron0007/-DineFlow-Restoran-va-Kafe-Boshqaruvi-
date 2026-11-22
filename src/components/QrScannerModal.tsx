import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { RealQrCode } from './RealQrCode';
import QRCode from 'qrcode';
import {
  QrCode,
  Camera,
  X,
  Download,
  Copy,
  Check,
  CheckCircle2,
  UserCheck,
  Users,
  MapPin,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose }) => {
  const {
    tables,
    waiters,
    activeTableNumber,
    setActiveTableNumber,
    restaurantName,
    addToast,
  } = useApp();
  const [activeTab, setActiveTab] = useState<'qr-cards' | 'camera'>('qr-cards');
  const [previewTableNum, setPreviewTableNum] = useState<number>(activeTableNumber || 1);
  const [copied, setCopied] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualQrInput, setManualQrInput] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && activeTableNumber) {
      setPreviewTableNum(activeTableNumber);
    }
  }, [isOpen, activeTableNumber]);

  // Camera stream lifecycle
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setCameraError(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }

          // Native BarcodeDetector if available
          if ('BarcodeDetector' in window) {
            const Detector = (window as any).BarcodeDetector;
            const detector = new Detector({ formats: ['qr_code'] });
            const interval = setInterval(async () => {
              if (!videoRef.current || cancelled) return;
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  clearInterval(interval);
                  handleProcessScannedUrl(barcodes[0].rawValue);
                }
              } catch {
                // Ignore frame errors
              }
            }, 500);
            return () => clearInterval(interval);
          }
        })
        .catch(() => {
          setCameraError(
            "Kameraga ruxsat berilmadi yoki qurilmada kamera topilmadi. Quyidagi stol QR-kodlaridan birini tanlab skanerlashni sinashingiz mumkin."
          );
        });
    } else {
      setCameraError("Brauzeringizda kamera API qo'llab-quvvatlanmaydi.");
    }

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const selectedTable =
    tables.find((t) => t.table_number === previewTableNum) || tables[0];

  const matchedWaiter = waiters.find((w) =>
    w.assigned_tables?.includes(previewTableNum)
  );

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const qrUrl = `${origin}/menu?table=${previewTableNum}&qr=${selectedTable?.qr_token || `qr-${previewTableNum}`}`;

  const handleProcessScannedUrl = (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    // Extract table number from URL or number string
    const tableMatch =
      trimmed.match(/[?&]table=(\d+)/i) ||
      trimmed.match(/\/table\/(\d+)/i) ||
      trimmed.match(/^(\d+)$/);

    if (tableMatch) {
      const detectedNum = parseInt(tableMatch[1], 10);
      const exists = tables.some((t) => t.table_number === detectedNum);
      if (exists || (detectedNum >= 1 && detectedNum <= 50)) {
        setActiveTableNumber(detectedNum);
        navigate(`/menu?table=${detectedNum}&qr=qr-${detectedNum}`);
        addToast(
          'success',
          `Stol №${detectedNum} avtomatik aniqlandi!`,
          `QR-kod muvaffaqiyatli o'qildi. Siz №${detectedNum}-stol menyusidasiz.`
        );
        onClose();
        return;
      }
    }

    addToast('error', "Noto'g'ri QR-kod", "QR-kod ichidan stol raqami topilmadi.");
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    addToast('info', 'Nusxa olindi', `Stol №${previewTableNum} QR havolasi nusxalandi.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrPng = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#173F35', light: '#FFFFFF' },
      });

      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 920;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#FAF8F3';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top Header Banner
      ctx.fillStyle = '#173F35';
      ctx.fillRect(0, 0, canvas.width, 130);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 28px Manrope, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(restaurantName || 'Zafaran Grand', canvas.width / 2, 60);

      ctx.fillStyle = '#A7F3D0';
      ctx.font = '600 18px Inter, sans-serif';
      ctx.fillText('RAQAMLI QR-MENYU (STOL AVTOMATIK ANIQLANADI)', canvas.width / 2, 98);

      // White QR frame
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(80, 170, 560, 560);
      ctx.strokeStyle = '#E5E0D8';
      ctx.lineWidth = 4;
      ctx.strokeRect(80, 170, 560, 560);

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 110, 200, 500, 500);

        // Table Badge at Bottom
        ctx.fillStyle = '#173F35';
        ctx.fillRect(160, 765, 400, 74);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 34px Manrope, sans-serif';
        ctx.fillText(`STOL № ${previewTableNum}`, canvas.width / 2, 814);

        ctx.fillStyle = '#737A75';
        ctx.font = '500 16px JetBrains Mono, monospace';
        ctx.fillText(
          `Telefon kamerangizni QR-kodga yo'naltiring`,
          canvas.width / 2,
          878
        );

        const link = document.createElement('a');
        link.download = `stol-${previewTableNum}-qr-kod.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      };
      img.src = qrDataUrl;
    } catch (err) {
      console.error('QR download error:', err);
    }
  };

  const zoneLabel =
    selectedTable?.zone === 'vip' || selectedTable?.tier === 'vip'
      ? 'VIP Xona'
      : selectedTable?.zone === 'terrace' || selectedTable?.tier === 'biznes'
      ? 'Biznes / Veranda'
      : 'Asosiy zal';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-[#E5E0D8] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#173F35] text-amber-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-[#173F35]">
                Stol QR-Kodi va Avtomatik Aniqlash
              </h3>
              <p className="text-xs text-[#737A75]">
                Mijoz stol raqamini bilishi shart emas — QR-kod stolni o'zi aniqlaydi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FAF8F3] hover:bg-[#E8F0EC] flex items-center justify-center text-[#737A75] hover:text-[#202622] transition-colors"
            aria-label="Yopish"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F3] rounded-2xl border border-[#E5E0D8] my-4">
          <button
            type="button"
            onClick={() => setActiveTab('qr-cards')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'qr-cards'
                ? 'bg-[#173F35] text-white shadow-xs'
                : 'text-[#737A75] hover:text-[#202622]'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Stollarning Tayyor QR-Kodlari</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-[#173F35] text-white shadow-xs'
                : 'text-[#737A75] hover:text-[#202622]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera orqali Skanerlash</span>
          </button>
        </div>

        {activeTab === 'qr-cards' ? (
          <div className="space-y-4">
            {/* Table Selector Grid */}
            <div>
              <label className="block text-xs font-bold text-[#202622] mb-2">
                Qaysi stolning QR-kodini olish yoki sinab ko'rmoqchisiz?
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-1">
                {tables.map((t) => {
                  const isSelected = t.table_number === previewTableNum;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPreviewTableNum(t.table_number)}
                      className={`py-2 rounded-xl font-mono font-bold text-xs tabular-nums transition-all border ${
                        isSelected
                          ? 'bg-[#173F35] text-amber-300 border-[#173F35] shadow-xs'
                          : 'bg-[#FAF8F3] text-[#202622] border-[#E5E0D8] hover:border-[#173F35]'
                      }`}
                    >
                      №{t.table_number}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scannable QR Card Preview */}
            <div className="bg-[#FAF8F3] rounded-2xl p-5 border border-[#E5E0D8] flex flex-col sm:flex-row items-center gap-5">
              <div className="shrink-0 flex flex-col items-center">
                <RealQrCode value={qrUrl} size={176} showCenterLogo />
                <span className="mt-2 font-mono text-[11px] font-bold text-[#173F35] tabular-nums">
                  STOL №{previewTableNum} QR-KODI
                </span>
              </div>

              <div className="flex-1 space-y-2.5 text-left w-full">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-800">
                    100% Haqiqiy Skanerlanadigan QR-Kod
                  </span>
                  <h4 className="font-display font-bold text-lg text-[#173F35]">
                    Stol №{previewTableNum} — {zoneLabel}
                  </h4>
                  <p className="text-xs text-[#737A75] mt-0.5">
                    Mijoz telefon kamerasini ushbu QR-kodga tutishi bilan tizim avtomatik{' '}
                    <strong className="text-[#202622]">№{previewTableNum}-stol</strong> menyusini
                    ochadi.
                  </p>
                </div>

                {/* Table Passport Details */}
                <div className="bg-white rounded-xl p-3 border border-[#E5E0D8] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#737A75] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#173F35]" />
                      <span>Zona va sig'im:</span>
                    </span>
                    <span className="font-semibold text-[#202622] tabular-nums">
                      {zoneLabel} · {selectedTable?.seats || 4} kishilik
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#737A75] flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-[#173F35]" />
                      <span>Mas'ul ofitsiant:</span>
                    </span>
                    <span className="font-semibold text-[#173F35]">
                      {matchedWaiter
                        ? `${matchedWaiter.badge_id} · ${matchedWaiter.full_name}`
                        : selectedTable?.assigned_waiter_name || 'Karimov Dilshod'}
                    </span>
                  </div>
                </div>

                {/* URL Box */}
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#E5E0D8] text-xs">
                  <span className="font-mono text-[11px] text-[#737A75] truncate mr-2 select-all">
                    {qrUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="text-[#173F35] hover:text-[#235B4E] font-bold flex items-center gap-1 shrink-0"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? 'Olindi' : 'Nusxa'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadQrPng}
                className="py-3 px-4 rounded-xl bg-[#FAF8F3] hover:bg-[#E8F0EC] text-[#173F35] border border-[#E5E0D8] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>QR-Kodni Yuklab Olish (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => handleProcessScannedUrl(qrUrl)}
                className="py-3 px-4 rounded-xl bg-[#173F35] hover:bg-[#235B4E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Stol №{previewTableNum} QR-kodi orqali kirish</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live Camera Viewport */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center border border-[#E5E0D8]">
              {!cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-44 h-44 border-2 border-amber-400 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                  </div>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[11px] font-medium px-3 py-1 rounded-lg">
                    Stol ustidagi QR-kodni ramka ichiga tuting
                  </span>
                </>
              ) : (
                <div className="p-6 text-center text-white/90 space-y-2 max-w-sm">
                  <Camera className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-xs leading-relaxed">{cameraError}</p>
                </div>
              )}
            </div>

            {/* Manual QR URL / Code simulation input */}
            <div className="bg-[#FAF8F3] p-4 rounded-2xl border border-[#E5E0D8] space-y-3">
              <label className="block text-xs font-bold text-[#202622]">
                QR-kod havolasini tekshirish yoki tezkor stol QR skanerlash:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualQrInput}
                  onChange={(e) => setManualQrInput(e.target.value)}
                  placeholder="Masalan: /menu?table=8 yoki 8"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E0D8] text-xs text-[#202622] focus:outline-none focus:border-[#173F35]"
                />
                <button
                  type="button"
                  onClick={() => handleProcessScannedUrl(manualQrInput)}
                  className="px-4 py-2.5 rounded-xl bg-[#173F35] text-white text-xs font-bold hover:bg-[#235B4E] shrink-0"
                >
                  O'qish
                </button>
              </div>

              <div className="pt-1">
                <span className="block text-[11px] text-[#737A75] mb-1.5">
                  Tezkor QR skanerlash simulyatsiyasi (bosish bilan stol avtomatik aniqlanadi):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 3, 5, 7, 10, 12, 15, 21].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() =>
                        handleProcessScannedUrl(`${origin}/menu?table=${num}&qr=qr-${num}`)
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#173F35] text-[#173F35] hover:text-white border border-[#E5E0D8] text-xs font-mono font-bold transition-colors"
                    >
                      QR Stol №{num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
