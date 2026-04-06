import React from 'react';

export function CenterOperationsArea({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-[calc(100vh-32px)] flex-col gap-5">
      {children}
    </main>
  );
}
