import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ChatTable from '@/components/ailab/ChatTable';

const components = {
  h1: ({ children }) => <h2 className="mb-3 mt-7 text-xl font-semibold tracking-tight first:mt-0">{children}</h2>,
  h2: ({ children }) => <h2 className="mb-3 mt-7 text-lg font-semibold tracking-tight first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-5 text-sm font-semibold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-4 leading-7 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-5 marker:text-muted-foreground [&_ul]:my-2 [&_p]:mb-1">{children}</ul>,
  ol: ({ children, start }) => <ol start={start} className="my-4 list-decimal space-y-2 pl-5 marker:font-medium marker:text-muted-foreground [&_ol]:my-2 [&_p]:mb-1">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="my-5 border-l-2 border-primary/60 bg-muted/40 px-4 py-3 text-muted-foreground [&_p]:mb-0">{children}</blockquote>,
  table: ChatTable,
  pre: ({ children }) => <pre className="my-5 overflow-x-auto rounded-xl border border-border bg-muted/60 p-4 text-xs leading-6 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-foreground">{children}</pre>,
  code: ({ children, className }) => <code className={`rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground ${className || ''}`}>{children}</code>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">{children}</a>,
  hr: () => <hr className="my-6 border-border" />,
};

export default function ChatMarkdown({ content }) {
  return <div className="min-w-0 max-w-full break-words text-sm text-foreground/90"><ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown></div>;
}