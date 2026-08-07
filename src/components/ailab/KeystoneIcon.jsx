import React from 'react';

// Custom Keystone AI logo — architectural keystone / K mark
export default function KeystoneIcon({ className = "w-6 h-6" }) {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`kg-${id}`} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Outer hexagon — rotated square for a premium gem / keystone silhouette */}
      <path
        d="M16 3 L28.5 9.5 L28.5 22.5 L16 29 L3.5 22.5 L3.5 9.5 Z"
        stroke={`url(#kg-${id})`}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.06"
      />

      {/* Inner accent hex — slightly rotated for depth */}
      <path
        d="M16 8 L23.5 12 L23.5 20 L16 24 L8.5 20 L8.5 12 Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        strokeOpacity="0.35"
        fill="currentColor"
        fillOpacity="0.10"
      />

      {/* Vertical spine — the K/keystone stem */}
      <line x1="16" y1="9.5" x2="16" y2="22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />

      {/* Upper arm of the K */}
      <path d="M16 15 L21.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />

      {/* Lower arm of the K */}
      <path d="M16 15 L21.5 22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />

      {/* Centre node — polished focal point */}
      <circle cx="16" cy="15" r="2" fill="currentColor" fillOpacity="0.9" />
      <circle cx="16" cy="15" r="3.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
    </svg>
  );
}