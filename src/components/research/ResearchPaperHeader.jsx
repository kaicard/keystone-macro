import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Clock, Tag, Share2, CheckCheck } from 'lucide-react';

export default function ResearchPaperHeader({ note, copied, onShare }) {
  const date = note.publish_date ? new Date(note.publish_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return <header>
    <div className="paper-top"><Link to="/Research"><ArrowLeft size={14} />Back to Research</Link><span className="paper-label">Keystone Macro</span></div>
    <div className="paper-kicker"><BookOpen size={16} strokeWidth={1.8} /><span className="paper-label">Research Note</span><span className="paper-dot">·</span><span className="paper-tag">{note.category}</span>
      {note.is_featured && <span className="paper-tag">Featured</span>}{note.is_premium && <span className="paper-tag">Premium</span>}
    </div>
    <h1>{note.title}</h1>
    {note.subtitle && <p className="paper-subtitle">{note.subtitle}</p>}
    <div className="paper-meta">
      {date && <span><Calendar size={14} strokeWidth={1.8} />{date}</span>}
      {note.read_time_minutes && <span><Clock size={14} strokeWidth={1.8} />{note.read_time_minutes} min read</span>}
    </div>
    {note.tags?.length > 0 && <div className="paper-tags"><Tag size={13} strokeWidth={1.8} />{note.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
    <button type="button" className="paper-share" onClick={onShare}>{copied ? <CheckCheck size={13} strokeWidth={1.8} /> : <Share2 size={13} strokeWidth={1.8} />}{copied ? 'Link copied' : 'Share'}</button>
  </header>;
}