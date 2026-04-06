import React from 'react';

export function LeftSidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="panel-surface flex min-h-[calc(100vh-32px)] flex-col gap-5 rounded-[34px] p-5">
      {children}
    </aside>
  );
}
