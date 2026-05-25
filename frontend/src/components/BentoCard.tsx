import type { ReactNode, MouseEventHandler } from 'react';

interface BentoCardProps {
  className?: string;
  children: ReactNode;
  gradient?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function BentoCard({ className = '', children, gradient = false, onClick }: BentoCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[#1c1c28] p-5 ${
        gradient
          ? 'bg-gradient-to-br from-emerald-500/5 to-cyan-500/5'
          : 'bg-[#0d0d14]'
      } ${onClick ? 'cursor-pointer hover:border-emerald-500/30 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
