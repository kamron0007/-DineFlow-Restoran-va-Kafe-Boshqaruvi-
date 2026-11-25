import React from 'react';
import { OrderStatus } from '../types';
import { Check, CheckCheck, XCircle } from 'lucide-react';

interface OrderTickBadgeProps {
  status: OrderStatus;
  compact?: boolean;
  darkSurface?: boolean;
}

/**
 * Telegram-style order confirmation ticks:
 * - status === 'new': 1 tick (✓) — Sent, waiting for waiter acceptance (cancellable)
 * - status === 'preparing' | 'ready' | 'delivered': 2 ticks (✓✓) — Accepted by waiter (locked)
 * - status === 'cancelled': Cancelled icon
 */
export const OrderTickBadge: React.FC<OrderTickBadgeProps> = ({
  status,
  compact = false,
  darkSurface = false,
}) => {
  if (status === 'cancelled') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold ${
          darkSurface ? 'text-red-300' : 'text-red-600'
        }`}
      >
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        {!compact && <span>Bekor qilingan</span>}
      </span>
    );
  }

  const isAccepted = status === 'preparing' || status === 'ready' || status === 'delivered';

  if (!isAccepted) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold ${
          darkSurface ? 'text-amber-300' : 'text-amber-700'
        }`}
        title="1 ta pitichka — buyurtma yuborildi, ofitsiant qabul qilishini kutmoqda"
      >
        <Check className="w-4 h-4 stroke-[2.6] shrink-0" />
        {!compact && <span>Yuborildi</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold ${
        darkSurface ? 'text-emerald-300' : 'text-emerald-700'
      }`}
      title="2 ta pitichka — ofitsiant buyurtmani qabul qildi"
    >
      <CheckCheck className="w-4 h-4 stroke-[2.6] shrink-0" />
      {!compact && (
        <span>
          {status === 'delivered'
            ? 'Yetkazildi'
            : status === 'ready'
            ? 'Tayyor'
            : 'Ofitsiant qabul qildi'}
        </span>
      )}
    </span>
  );
};
