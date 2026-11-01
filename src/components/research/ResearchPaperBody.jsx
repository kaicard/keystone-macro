import React from 'react';
import ResearchPaperMarkdown from '@/components/research/ResearchPaperMarkdown';
import { stripCitationMarkers } from '@/lib/stripCitations';

function normalizeMarkdownBody(body) {
  if (!body) return body;
  let result = body.replace(/([^\n])(\s*)(?=## )/g, '$1\n\n');
  return result.replace(/^(## [^\n]+?)\. ([A-Z][^\n]*)$/gm, (match, heading, rest) => heading.length < 120 ? `${heading}.\n\n${rest}` : match);
}

export default function ResearchPaperBody({ note, photos }) {
  const chunks = stripCitationMarkers(normalizeMarkdownBody(note.body) || '').split(/(?=^## )/m).filter(chunk => chunk.trim());
  let number = 0;
  return <>
    {(note.executive_summary || photos.lead) && <section className={`paper-executive${photos.lead ? '' : ' paper-executive-text'}`}>
      <div>{note.executive_summary && <><h2 className="paper-label">Executive Summary</h2><p>{stripCitationMarkers(note.executive_summary)}</p></>}</div>
      {photos.lead && <figure className="paper-figure"><img src={photos.lead.url} alt={photos.lead.alt} /></figure>}
    </section>}
    {chunks.map((chunk, index) => {
      const heading = chunk.match(/^## (.+)/)?.[1]?.trim();
      if (heading) number++;
      const photo = heading === photos.section?.heading ? photos.section : null;
      return <section className="paper-row" key={index}>
        <span className="paper-number" aria-hidden="true">{heading ? String(number).padStart(2, '0') : ''}</span>
        <div className={`paper-column${photo ? ' paper-column-wide' : ''}`}>
          <div><ResearchPaperMarkdown>{chunk}</ResearchPaperMarkdown></div>
          {photo && <figure className="paper-figure-secondary"><img src={photo.url} alt={photo.alt} loading="lazy" /></figure>}
        </div>
      </section>;
    })}
    {photos.band && <figure className="paper-band"><img src={photos.band.url} alt={photos.band.alt} loading="lazy" /></figure>}
  </>;
}