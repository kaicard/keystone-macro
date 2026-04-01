import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Linkedin, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', type: 'general' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.ContactMessage.create(form);
    setSubmitted(true);
    setLoading(false);
    toast({ title: 'Message sent', description: 'Thank you for reaching out. I\'ll get back to you shortly.' });
  };

  return (
    <div className="pt-20 lg:pt-24 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Get In Touch</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Open to conversations on markets, collaboration, and professional opportunities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <a href="mailto:hello@keystonemacro.com"
            className="glass rounded-xl p-6 text-center hover:border-primary/20 transition-all group">
            <Mail className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="font-medium text-sm group-hover:text-primary transition-colors">Email</p>
            <p className="text-xs text-muted-foreground mt-1">hello@keystonemacro.com</p>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
            className="glass rounded-xl p-6 text-center hover:border-primary/20 transition-all group">
            <Linkedin className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="font-medium text-sm group-hover:text-primary transition-colors">LinkedIn</p>
            <p className="text-xs text-muted-foreground mt-1">Connect professionally</p>
          </a>
          <div className="glass rounded-xl p-6 text-center">
            <Send className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="font-medium text-sm">Newsletter</p>
            <p className="text-xs text-muted-foreground mt-1">Weekly macro digest</p>
          </div>
        </div>

        {submitted ? (
          <motion.div
            className="glass rounded-2xl p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold mb-2">Message Sent</h2>
            <p className="text-muted-foreground">Thank you for reaching out. I'll respond as soon as possible.</p>
          </motion.div>
        ) : (
          <motion.form
            className="glass rounded-2xl p-8"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="font-semibold text-lg mb-6">Send a Message</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  required
                  className="glass border-border/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  required
                  className="glass border-border/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Subject"
                  className="glass border-border/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="glass border-border/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="collaboration">Collaboration</SelectItem>
                    <SelectItem value="media">Media / Speaking</SelectItem>
                    <SelectItem value="speaking">Career Opportunity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <Label className="text-xs text-muted-foreground">Message</Label>
              <Textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Your message..."
                rows={6}
                required
                className="glass border-border/30"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Send Message'}
            </Button>
          </motion.form>
        )}
      </div>
    </div>
  );
}