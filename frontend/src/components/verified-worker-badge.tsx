import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface VerifiedWorkerBadgeProps {
  isVerified?: boolean | null;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'emerald' | 'subtle' | 'pill';
}

export function VerifiedWorkerBadge({
  isVerified,
  size = 'md',
  showText = true,
  className = '',
  variant = 'emerald',
}: VerifiedWorkerBadgeProps) {
  // Render ONLY when worker is explicitly verified
  if (isVerified !== true) {
    return null;
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-xs sm:text-sm',
  };

  const paddingSizes = {
    sm: 'px-1.5 py-0.5 gap-1',
    md: 'px-2 py-0.5 gap-1.5',
    lg: 'px-2.5 py-1 gap-1.5',
  };

  let variantStyles =
    'bg-emerald-50 text-emerald-800 border-emerald-200/90 shadow-2xs font-extrabold';
  if (variant === 'subtle') {
    variantStyles = 'bg-emerald-50/70 text-emerald-700 border-emerald-100 font-bold';
  } else if (variant === 'pill') {
    variantStyles =
      'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-black tracking-wide';
  }

  return (
    <span
      role="status"
      aria-label="Verified worker"
      title="Verified worker (Identity & Background Checked)"
      data-testid="verified-worker-badge"
      className={`inline-flex items-center rounded-full border transition-all ${paddingSizes[size]} ${textSizes[size]} ${variantStyles} ${className}`}
    >
      <CheckCircle2
        aria-hidden="true"
        className={`${iconSizes[size]} shrink-0 ${
          variant === 'pill' ? 'text-white' : 'text-emerald-600'
        }`}
      />
      {showText && <span>Verified worker</span>}
    </span>
  );
}
