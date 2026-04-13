import React from 'react';

export function GlassCard({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`panel-surface ${className}`}>
      {children}
    </section>
  );
}
