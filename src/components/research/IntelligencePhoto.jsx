import React, { useState } from 'react';

export default function IntelligencePhoto({ photo, compact = false }) {
  const [failedUrl, setFailedUrl] = useState(null);
  if (!photo?.url || failedUrl === photo.url) return null;
  return <figure className={compact ? 'mb-5 overflow-hidden border border-border bg-background' : 'mb-6 overflow-hidden border border-border bg-card'}>
    <img src={photo.url} alt={photo.title} loading="lazy" decoding="async" onError={() => setFailedUrl(photo.url)} className={compact ? 'aspect-[2/1] w-full object-cover' : 'max-h-[420px] w-full object-cover'} />
    <figcaption className="border-t border-border px-4 py-3 text-[10px] leading-relaxed text-muted-foreground sm:text-xs">
      <span className="block mb-1">{photo.title}. Illustrative archive photograph{photo.date ? `, ${photo.date}` : ''}, not a photograph of this news event.</span>
      Photo: {photo.author}.{' '}
      {photo.licenseUrl ? <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">{photo.license}</a> : photo.license}.{' '}
      <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">Wikimedia Commons</a>.
    </figcaption>
  </figure>;
}