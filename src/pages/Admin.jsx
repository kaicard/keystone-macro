import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileText, Briefcase, Users, Mail, Trash2, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

const categories = ['Macro', 'Equities', 'Fixed Income', 'Multi-Asset', 'Commodities', 'Wealth Strategy', 'Behavioural Finance', 'Risk Management', 'Trade Reviews'];

function ResearchForm({ note, onSave, onClose }) {
  const [form, setForm] = useState(note || {
    title: '', subtitle: '', category: 'Macro', executive_summary: '', body: '',
    key_risks: '', takeaway: '', what_would_change_mind: '', read_time_minutes: 5,
    status: 'draft', is_featured: false, is_premium: false, tags: [],
    publish_date: new Date().toISOString().split('T')[0]
  });
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const addTag = () => {
    if (tagInput && !form.tags?.includes(tagInput)) {
      setForm({ ...form, tags: [...(form.tags || []), tagInput] });
      setTagInput('');
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Title</Label>
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Category</Label>
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Subtitle</Label>
        <Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Executive Summary</Label>
        <Textarea value={form.executive_summary} onChange={e => setForm({ ...form, executive_summary: e.target.value })} rows={3} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Body (Markdown)</Label>
        <Textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={8} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Key Risks</Label>
          <Textarea value={form.key_risks} onChange={e => setForm({ ...form, key_risks: e.target.value })} rows={3} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Key Takeaway</Label>
          <Textarea value={form.takeaway} onChange={e => setForm({ ...form, takeaway: e.target.value })} rows={3} />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">What Would Change My Mind</Label>
        <Textarea value={form.what_would_change_mind} onChange={e => setForm({ ...form, what_would_change_mind: e.target.value })} rows={2} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Read Time (min)</Label>
          <Input type="number" value={form.read_time_minutes} onChange={e => setForm({ ...form, read_time_minutes: parseInt(e.target.value) })} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Publish Date</Label>
          <Input type="date" value={form.publish_date} onChange={e => setForm({ ...form, publish_date: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
          <span className="text-sm">Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_premium} onChange={e => setForm({ ...form, is_premium: e.target.checked })} className="rounded" />
          <span className="text-sm">Premium</span>
        </label>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Tags</Label>
        <div className="flex gap-2">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {form.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="cursor-pointer text-xs" onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })}>
              {tag} ×
            </Badge>
          ))}
        </div>
      </div>
      <Button onClick={handleSave} className="w-full">Save Research Note</Button>
    </div>
  );
}

const ADMIN_EMAILS = ['kaicard05@gmail.com', 'hello@keystonemacro.com'];

export default function Admin() {
  const queryClient = useQueryClient();
  const [editingNote, setEditingNote] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { data: notes = [] } = useQuery({ queryKey: ['admin-notes'], queryFn: () => base44.entities.ResearchNote.list('-created_date', 100) });
  const { data: subscribersData = [] } = useQuery({
    queryKey: ['admin-subs'],
    queryFn: async () => {
      const [free, paid] = await Promise.all([
        base44.entities.NewsletterSubscriber.list('-created_date', 100),
        base44.entities.NewsletterSubscription.list('-created_date', 100),
      ]);
      const freeList = (free || []).map(s => ({ ...s, type: 'free' }));
      const paidList = (paid || []).filter(s => s.status !== 'pending').map(s => ({ ...s, type: 'premium' }));
      return [...paidList, ...freeList].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });
  const { data: messages = [] } = useQuery({ queryKey: ['admin-msgs'], queryFn: () => base44.entities.ContactMessage.list('-created_date', 100) });

  const createNote = useMutation({
    mutationFn: (data) => base44.entities.ResearchNote.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-notes'] }); toast({ title: 'Note created' }); }
  });

  const updateNote = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ResearchNote.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-notes'] }); toast({ title: 'Note updated' }); }
  });

  const deleteNote = useMutation({
    mutationFn: (id) => base44.entities.ResearchNote.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-notes'] }); toast({ title: 'Note deleted' }); }
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="pt-20 lg:pt-24 pb-20 min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/" replace />;
  }

  const handleSave = (data) => {
    if (editingNote?.id) {
      updateNote.mutate({ id: editingNote.id, data });
    } else {
      createNote.mutate(data);
    }
    setEditingNote(null);
  };

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-semibold mb-2">Admin</h1>
          <p className="text-muted-foreground">Manage content, research notes, and subscribers.</p>
        </motion.div>

        <Tabs defaultValue="research" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="research" className="gap-1"><FileText className="w-3.5 h-3.5" /> Research</TabsTrigger>
            <TabsTrigger value="subscribers" className="gap-1"><Mail className="w-3.5 h-3.5" /> Subscribers</TabsTrigger>
            <TabsTrigger value="messages" className="gap-1"><Users className="w-3.5 h-3.5" /> Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="research">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold">{notes.length} Research Notes</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" onClick={() => setEditingNote(null)}>
                    <Plus className="w-4 h-4" /> New Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>{editingNote ? 'Edit Note' : 'New Research Note'}</DialogTitle></DialogHeader>
                  <ResearchForm note={editingNote} onSave={handleSave} onClose={() => setDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {notes.map(note => (
                <div key={note.id} className="glass rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{note.title}</h3>
                      <Badge variant="outline" className="text-xs shrink-0">{note.category}</Badge>
                      <Badge variant={note.status === 'published' ? 'default' : 'secondary'} className="text-xs shrink-0">{note.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{note.executive_summary}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingNote(note); setDialogOpen(true); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteNote.mutate(note.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {notes.length === 0 && <p className="text-center py-12 text-muted-foreground">No research notes yet. Create your first one.</p>}
            </div>
          </TabsContent>

          <TabsContent value="subscribers">
            <h2 className="font-semibold mb-6">{subscribersData.length} Subscribers</h2>
            <div className="space-y-2">
              {subscribersData.map(sub => (
                <div key={sub.id} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{sub.email}</p>
                    <p className="text-xs text-muted-foreground">{new Date(sub.created_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sub.type === 'premium' ? 'default' : 'outline'} className="text-xs">
                      {sub.type === 'premium' ? '💎 Premium' : 'Free'}
                    </Badge>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>{sub.status}</Badge>
                  </div>
                </div>
              ))}
              {subscribersData.length === 0 && <p className="text-center py-12 text-muted-foreground">No subscribers yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <h2 className="font-semibold mb-6">{messages.length} Messages</h2>
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className="glass rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{msg.name}</span>
                      <span className="text-xs text-muted-foreground">{msg.email}</span>
                    </div>
                    <Badge variant={msg.status === 'new' ? 'default' : 'secondary'} className="text-xs">{msg.status}</Badge>
                  </div>
                  {msg.subject && <p className="text-sm font-medium mb-1">{msg.subject}</p>}
                  <p className="text-sm text-muted-foreground">{msg.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">{new Date(msg.created_date).toLocaleDateString()}</p>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center py-12 text-muted-foreground">No messages yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}