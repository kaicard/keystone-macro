import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, Tag, AlertTriangle, Lightbulb, TrendingUp, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

const categoryColors = {
  'Macro': 'bg-chart-1/10 text-chart-1',
  'Multi-Asset': 'bg-chart-2/10 text-chart-2',
  'Equities': 'bg-chart-3/10 text-chart-3',
  'Wealth Strategy': 'bg-chart-4/10 text-chart-4',
  'Fixed Income': 'bg-chart-5/10 text-chart-5',
  'Commodities': 'bg-amber-400/10 text-amber-400',
  'Behavioural Finance': 'bg-purple-400/10 text-purple-400',
  'Risk Management': 'bg-red-400/10 text-red-400',
  'Trade Reviews': 'bg-cyan-400/10 text-cyan-400',
};

export default function ResearchNoteModal({ note, onClose }) {
  if (!note) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-3xl glass-strong rounded-2xl overflow-hidden my-8"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-border/40">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${categoryColors[note.category] || ''}`}>
                  {note.category}
                </Badge>
                {note.is_featured && (
                  <Badge className="bg-primary/10 text-primary border-0 text-xs">Featured</Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />{note.read_time_minutes} min read
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(note.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/20 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight mb-2">{note.title}</h1>
            {note.subtitle && <p className="text-muted-foreground text-base">{note.subtitle}</p>}

            {note.tags?.length > 0 && (
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <Tag className="w-3 h-3 text-muted-foreground/50" />
                {note.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[65vh] overflow-y-auto">

            {/* Executive Summary */}
            {note.executive_summary && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">Executive Summary</p>
                <p className="text-sm leading-relaxed text-foreground/90">{note.executive_summary}</p>
              </div>
            )}

            {/* Main body */}
            {note.body && (
              <div className="prose prose-sm prose-invert max-w-none
                [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground
                [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground
                [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:mb-3
                [&_ul]:space-y-1.5 [&_ul]:my-3 [&_ul]:ml-4
                [&_li]:text-sm [&_li]:text-muted-foreground [&_li]:leading-relaxed
                [&_strong]:text-foreground [&_strong]:font-semibold
                [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:my-4 [&_blockquote]:text-muted-foreground/80 [&_blockquote]:italic">
                <ReactMarkdown>{note.body}</ReactMarkdown>
              </div>
            )}

            {/* Key Risks */}
            {note.key_risks && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-red-400">Key Risks</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{note.key_risks}</p>
              </div>
            )}

            {/* Takeaway */}
            {note.takeaway && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-primary">Key Takeaway</h3>
                </div>
                <p className="text-sm leading-relaxed font-medium">{note.takeaway}</p>
              </div>
            )}

            {/* What Would Change My Mind */}
            {note.what_would_change_mind && (
              <div className="rounded-xl border border-border/30 bg-muted/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold">What Would Change My Mind</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{note.what_would_change_mind}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 sm:px-8 py-4 border-t border-border/40 flex items-center justify-between">

            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted/20"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}