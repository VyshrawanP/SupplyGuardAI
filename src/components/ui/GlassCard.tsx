import React from 'react';

export function GlassCard({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-[28px] border border-white/10 bg-white/5 ${className}`}>
      {children}
    </section>
  );
}
