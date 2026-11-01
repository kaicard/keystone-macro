import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components = {
  table: ({ children }) => <div className="paper-table"><table>{children}</table></div>,
  img: ({ src, alt }) => <img src={src} alt={alt || ''} loading="lazy" />,
};

export default function ResearchPaperMarkdown({ children }) {
  return <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>;
}