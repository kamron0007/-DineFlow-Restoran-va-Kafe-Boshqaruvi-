import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { UtensilsCrossed } from 'lucide-react';

interface RealQrCodeProps {
  value: string;
  size?: number;
  showCenterLogo?: boolean;
  className?: string;
}

export const RealQrCode: React.FC<RealQrCodeProps> = ({
  value,
  size = 200,
  showCenterLogo = true,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#173F35',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (mounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation error:', err);
      });

    return () => {
      mounted = false;
    };
  }, [value, size]);

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-white p-3 rounded-2xl border border-[#E5E0D8] shadow-xs ${className}`}
      style={{ width: size + 24, height: size + 24 }}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR Code: ${value}`}
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain rounded-lg select-none"
        />
      ) : (
        <div
          className="w-full h-full bg-[#FAF8F3] rounded-lg animate-pulse flex items-center justify-center text-xs text-[#737A75]"
          style={{ width: size, height: size }}
        >
          QR...
        </div>
      )}

      {showCenterLogo && dataUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-xl bg-white shadow-md border border-[#E5E0D8] flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      )}
    </div>
  );
};
