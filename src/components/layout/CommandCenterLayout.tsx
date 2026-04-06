import React from 'react';

export function CommandCenterLayout({
  left,
  center,
  right,
}: {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#040b14_0%,#071220_48%,#0a1520_100%)] px-4 py-4 text-white lg:px-5">
      <div className="mx-auto grid max-w-[1760px] gap-5 xl:grid-cols-[360px_minmax(0,1fr)_380px]">
        {left}
        {center}
        {right}
      </div>
    </div>
  );
}
