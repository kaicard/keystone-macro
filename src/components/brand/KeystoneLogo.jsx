import React from 'react';

export function KeystoneMark({ className = 'h-7 w-10', title = 'Keystone Macro' }) {
  const titleId = React.useId().replace(/:/g, '');
  return (
    <svg
      className={className}
      viewBox="0 0 160 100"
      role="img"
      aria-labelledby={titleId}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={titleId}>{title}</title>
      <g fill="currentColor">
        <path d="M64 12H96L88 88H72L64 12Z" />
        <path d="M53 25L63 18L57 88H43L53 25Z" opacity="0.96" />
        <path d="M97 18L107 25L117 88H103L97 18Z" opacity="0.96" />
        <path d="M40 42L49 33L36 88H24L40 42Z" opacity="0.88" />
        <path d="M111 33L120 42L136 88H124L111 33Z" opacity="0.88" />
        <path d="M27 59L34 50L18 88H9L27 59Z" opacity="0.76" />
        <path d="M126 50L133 59L151 88H142L126 50Z" opacity="0.76" />
        <path d="M15 72L20 64L8 88H2L15 72Z" opacity="0.58" />
        <path d="M140 64L145 72L158 88H152L140 64Z" opacity="0.58" />
      </g>
    </svg>
  );
}

export default function KeystoneLogo({
  className = '',
  markClassName = 'h-7 w-10 text-primary',
  wordmarkClassName = '',
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <KeystoneMark className={markClassName} />
      <span className={`flex flex-col leading-none ${wordmarkClassName}`}>
        <span className="font-display text-[14px] font-semibold uppercase tracking-[0.045em] text-foreground">
          Keystone
        </span>
        <span className="mt-1 text-[7px] font-semibold uppercase tracking-[0.38em] text-primary">
          Macro
        </span>
      </span>
    </span>
  );
}
