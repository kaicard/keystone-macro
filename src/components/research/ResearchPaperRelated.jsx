import React from 'react';
import { Link } from 'react-router-dom';

const slugFor = title => title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim() || '';

export default function ResearchPaperRelated({ related }) {
  if (!related.length) return null;
  return <section className="paper-related">
    <h2>Related Research</h2>
    <div className="paper-related-grid">{related.map(note => <Link key={note.id} to={`/Research/${note.slug || slugFor(note.title)}`}>
      <span className="paper-label">{note.category}</span>
      <h3>{note.title}</h3>
      <p>{new Date(note.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
    </Link>)}</div>
  </section>;
}