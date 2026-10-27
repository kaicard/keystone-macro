import React from 'react';

export default function ChatTable({ children }) {
  return (
    <div className="my-5 min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto overscroll-x-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" tabIndex={0} role="region" aria-label="Research table, scroll horizontally to view all columns">
        <table className="w-full border-collapse text-left text-[13px] leading-6 tabular-nums [&_th]:min-w-32 [&_th]:max-w-sm [&_th]:border-b [&_th]:border-border [&_th]:bg-muted [&_th]:px-4 [&_th]:py-3 [&_th]:align-top [&_th]:font-semibold [&_th]:text-foreground [&_td]:min-w-32 [&_td]:max-w-sm [&_td]:border-b [&_td]:border-border/60 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top [&_td]:text-foreground/85 [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr:nth-child(even)]:bg-muted/30 [&_th:first-child]:font-semibold [&_td:first-child]:font-medium [&_td:first-child]:text-foreground [&_p]:mb-0 [&_ul]:my-0 [&_ol]:my-0">
          {children}
        </table>
      </div>
    </div>
  );
}