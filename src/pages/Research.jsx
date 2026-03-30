import React, { useState, useMemo } from 'react';
import PageBackground from '@/components/layout/PageBackground';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid3X3, List, Clock, Filter, ArrowRight, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LiveNewsFeed from '@/components/research/LiveNewsFeed';
import NewsHub from '@/components/research/NewsHub';
import TrendingThemes from '@/components/research/TrendingThemes';
import ResearchNoteModal from '@/components/research/ResearchNoteModal';
import { sampleNotes } from '@/lib/researchNotes';

const categories = ['All', 'Macro', 'Equities', 'Fixed Income', 'Multi-Asset', 'Commodities', 'Wealth Strategy', 'Behavioural Finance', 'Risk Management', 'Trade Reviews'];

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

function NoteCard({ note, viewMode, delay, onClick }) {
  return (
    <motion.div
      className={`glass rounded-xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group ${
        viewMode === 'list' ? 'flex gap-6 items-start' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className={`text-xs ${categoryColors[note.category] || 'bg-muted text-muted-foreground'}`}>
            {note.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />{note.read_time_minutes} min read
          </span>
        </div>
        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">{note.title}</h3>
        {note.subtitle && <p className="text-sm text-muted-foreground/80 mb-2">{note.subtitle}</p>}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{note.executive_summary}</p>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {note.tags?.slice(0, 3).map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-muted-foreground/50">
            {new Date(note.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            Read note <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

const INITIAL_VISIBLE = 6;

export default function Research() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const { data: dbNotes } = useQuery({
    queryKey: ['research-notes'],
    queryFn: () => base44.entities.ResearchNote.list('-created_date', 50),
    initialData: [],
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const allNotes = dbNotes.length > 0 ? dbNotes : sampleNotes;

  // Always sort most recent first
  const sorted = useMemo(() =>
    [...allNotes].sort((a, b) => new Date(b.publish_date) - new Date(a.publish_date)),
    [allNotes]
  );

  const filtered = useMemo(() => {
    setShowAll(false);
    return sorted.filter(note => {
      const matchesSearch = !search || note.title?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || note.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, search, activeCategory]);

  const featured = filtered.find(n => n.is_featured) || filtered[0];

  const nonFeatured = filtered.filter(n => n !== featured || search || activeCategory !== 'All');
  const visibleNotes = showAll ? nonFeatured : nonFeatured.slice(0, INITIAL_VISIBLE);
  const hasMore = nonFeatured.length > INITIAL_VISIBLE && !showAll;
  const isFiltering = search || activeCategory !== 'All';

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen relative">
      <PageBackground />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Research & Intelligence</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Live market intelligence, macro themes, and original research notes.
          </p>
        </motion.div>

        {/* Intelligence Feed stacked above News by Beat */}
        <motion.div
          className="mb-8 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <LiveNewsFeed />
          <NewsHub />
        </motion.div>

        {/* Trending Themes */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TrendingThemes />
        </motion.div>

        {/* Research Notes Header */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Research Notes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Click any note to read in full</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 glass border-border/30"
              />
            </div>
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-40 glass border-border/30">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="rounded-none h-9 w-9" onClick={() => setViewMode('grid')}>
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="rounded-none h-9 w-9" onClick={() => setViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Featured */}
        {featured && activeCategory === 'All' && !search && (
          <motion.div
            className="glass rounded-2xl p-8 mb-8 hover:border-primary/30 transition-all cursor-pointer glow-primary group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setSelectedNote(featured)}
          >
            <div className="flex items-start justify-between gap-4">
              <Badge className="bg-primary/10 text-primary border-0 mb-4">Featured</Badge>
              <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-2 group-hover:text-primary transition-colors">{featured.title}</h2>
            {featured.subtitle && <p className="text-muted-foreground mb-4">{featured.subtitle}</p>}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{featured.executive_summary}</p>
            <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground flex-wrap">
              <Badge variant="outline" className={categoryColors[featured.category]}>{featured.category}</Badge>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.read_time_minutes} min read</span>
              <span>{new Date(featured.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </motion.div>
        )}

        {/* Notes Grid */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          <AnimatePresence>
            {visibleNotes.map((note, i) => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode={viewMode}
                delay={i * 0.04}
                onClick={() => setSelectedNote(note)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* See More / See Less */}
        {nonFeatured.length > INITIAL_VISIBLE && !isFiltering && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setShowAll(v => !v)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-200 group"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAll ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
              {showAll ? 'See less' : `See ${nonFeatured.length - INITIAL_VISIBLE} more note${nonFeatured.length - INITIAL_VISIBLE !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">No research notes found</p>
            <p className="text-sm">Adjust your search or filters</p>
          </div>
        )}
      </div>

      {/* Note Reader Modal */}
      {selectedNote && (
        <ResearchNoteModal note={selectedNote} onClose={() => setSelectedNote(null)} />
      )}
    </div>
  );
}