import React from 'react';

export default function PageBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,hsl(var(--primary)/0.055),transparent_28%),radial-gradient(circle_at_82%_30%,hsl(var(--accent)/0.035),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-card/18 to-transparent" />
      <div className="absolute inset-0 opacity-[0.018] [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:88px_88px]" />
    </div>
  );
}
