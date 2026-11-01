import React from 'react';
import { AlertTriangle, Lightbulb, Eye } from 'lucide-react';
import { stripCitationMarkers } from '@/lib/stripCitations';

export default function ResearchPaperClosing({ note }) {
  const rows = [
    { label: 'Key Risks', value: note.key_risks, Icon: AlertTriangle },
    { label: 'Key Takeaway', value: note.takeaway, Icon: Lightbulb },
    { label: 'What Would Change My Mind', value: note.what_would_change_mind, Icon: Eye },
  ].filter(row => row.value);
  if (!rows.length) return null;
  return <div className="paper-closing">{rows.map(({ label, value, Icon }) => <section className="paper-closing-row" key={label}>
    <h2 className="paper-label"><Icon size={15} strokeWidth={1.8} />{label}</h2>
    <p>{stripCitationMarkers(value)}</p>
  </section>)}</div>;
}