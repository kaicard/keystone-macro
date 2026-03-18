import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Search, Grid3X3, List, Clock, Tag, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const categories = ['All', 'Macro', 'Equities', 'Fixed Income', 'Multi-Asset', 'Commodities', 'Wealth Strategy', 'Behavioural Finance', 'Risk Management', 'Trade Reviews'];

const sampleNotes = [
  { id: 1, title: 'The Rate Regime Shift: Navigating Higher-for-Longer', subtitle: 'Implications for multi-asset allocation', category: 'Macro', tags: ['Rates', 'Duration', 'Central Banks'], publish_date: '2026-03-15', read_time_minutes: 8, executive_summary: 'Central banks signal a prolonged period of elevated rates. We examine the implications for multi-asset allocation and duration positioning across developed markets.', is_featured: true },
  { id: 2, title: 'Strategic vs Tactical: When to Deviate from SAA', subtitle: 'A framework for tactical tilts', category: 'Multi-Asset', tags: ['SAA', 'TAA', 'Risk Budget'], publish_date: '2026-03-12', read_time_minutes: 12, executive_summary: 'A framework for determining when tactical tilts are warranted, including regime signals and risk budget considerations.' },
  { id: 3, title: 'Concentration Risk in US Equities', subtitle: 'Portfolio diversification challenges', category: 'Equities', tags: ['US Equity', 'Diversification', 'Tech'], publish_date: '2026-03-10', read_time_minutes: 10, executive_summary: 'The S&P 500 top-10 weight exceeds 35%. We assess diversification options and hedging strategies for equity-heavy portfolios.' },
  { id: 4, title: 'Tax-Efficient Accumulation Strategies', subtitle: 'ISA, pension, and beyond', category: 'Wealth Strategy', tags: ['Tax', 'ISA', 'Pension', 'UK'], publish_date: '2026-03-08', read_time_minutes: 7, executive_summary: 'An educational overview of UK tax wrappers and their role in long-term wealth building for mid-career professionals.' },
  { id: 5, title: 'Gold in a Multi-Asset Context', subtitle: 'Hedge, store of value, or both?', category: 'Commodities', tags: ['Gold', 'Inflation', 'Hedge'], publish_date: '2026-03-05', read_time_minutes: 9, executive_summary: 'Examining gold\'s role as a portfolio diversifier across different macro regimes and its correlation properties.' },
  { id: 6, title: 'Behavioural Biases in Drawdowns', subtitle: 'Managing emotions in volatile markets', category: 'Behavioural Finance', tags: ['Psychology', 'Drawdown', 'Risk'], publish_date: '2026-03-02', read_time_minutes: 6, executive_summary: 'How cognitive biases affect investment decisions during market stress and frameworks for maintaining process discipline.' },
];

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

export default function Research() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid');

  const { data: dbNotes } = useQuery({
    queryKey: ['research-notes'],
    queryFn: () => base44.entities.ResearchNote.list('-created_date', 50),
    initialData: [],
  });

  const allNotes = dbNotes.length > 0 ? dbNotes : sampleNotes;

  const filtered = allNotes.filter(note => {
    const matchesSearch = !search || note.title?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || note.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featured = filtered.find(n => n.is_featured) || filtered[0];

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Research</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Market commentary, investment theses, and portfolio insights. For educational purposes only.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search research..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 glass border-border/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={activeCategory} onValueChange={setActiveCategory}>
              <SelectTrigger className="w-44 glass border-border/30">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none h-9 w-9"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Featured */}
        {featured && activeCategory === 'All' && !search && (
          <motion.div
            className="glass rounded-2xl p-8 mb-8 hover:border-primary/20 transition-all cursor-pointer glow-primary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="bg-primary/10 text-primary border-0 mb-4">Featured</Badge>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold mb-3">{featured.title}</h2>
            {featured.subtitle && <p className="text-muted-foreground mb-4">{featured.subtitle}</p>}
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{featured.executive_summary}</p>
            <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
              <Badge variant="outline" className={categoryColors[featured.category]}>{featured.category}</Badge>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{featured.read_time_minutes} min</span>
              <span>{new Date(featured.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </motion.div>
        )}

        {/* Notes grid/list */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filtered.filter(n => n !== featured || search || activeCategory !== 'All').map((note, i) => (
            <motion.div
              key={note.id}
              className={`glass rounded-xl p-6 hover:border-primary/20 transition-all duration-300 cursor-pointer group ${
                viewMode === 'list' ? 'flex gap-6 items-start' : ''
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className={`text-xs ${categoryColors[note.category] || 'bg-muted text-muted-foreground'}`}>
                    {note.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />{note.read_time_minutes} min
                  </span>
                </div>
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{note.title}</h3>
                {note.subtitle && <p className="text-sm text-muted-foreground/80 mb-2">{note.subtitle}</p>}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{note.executive_summary}</p>
                <div className="flex items-center gap-2 mt-4">
                  {note.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/60 mt-3">
                  {new Date(note.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">No research notes found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}