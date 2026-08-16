import React from 'react';

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.10),transparent_34%),radial-gradient(circle_at_84%_62%,hsl(var(--accent)/0.055),transparent_28%)]" />
      <div className="absolute inset-0 opacity-[0.022] [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute left-1/2 top-[38%] h-px w-[min(82vw,980px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
}
