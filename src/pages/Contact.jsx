import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const initialType = new URLSearchParams(window.location.search).get('type') === 'early-careers' ? 'early-careers' : 'general';
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', type: initialType });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.ContactMessage.create(form);
    await base44.functions.invoke('sendContactEmail', form);
    setSubmitted(true);
    setLoading(false);
    toast({ title: 'Message sent', description: 'Thank you for reaching out. I\'ll get back to you shortly.' });
  };

  return (
    <div className="pt-24 lg:pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold mb-3">Contact</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Open to conversations on markets, collaboration, early-career questions, and professional opportunities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <a href="mailto:hello@keystonemacro.com"
            className="rounded-xl border border-border/55 bg-card/45 p-5 text-center hover:border-primary/20 hover:bg-card/65 transition-colors group">
            <Mail className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="font-medium text-sm group-hover:text-primary transition-colors">Email</p>
            <p className="text-xs text-muted-foreground mt-1">hello@keystonemacro.com</p>
          </a>
          <a href="https://www.linkedin.com/company/keystone-macro/" target="_blank" rel="noopener noreferrer"
            className="rounded-xl border border-border/55 bg-card/45 p-5 text-center hover:border-primary/20 hover:bg-card/65 transition-colors group">
            <Linkedin className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="font-medium text-sm group-hover:text-primary transition-colors">LinkedIn</p>
            <p className="text-xs text-muted-foreground mt-1">Connect professionally</p>
          </a>
          <Link to="/Newsletter"
            className="rounded-xl border border-border/55 bg-card/45 p-5 text-center hover:border-primary/20 hover:bg-card/65 transition-colors group">
            <Send className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="font-medium text-sm group-hover:text-primary transition-colors">Newsletter</p>
            <p className="text-xs text-muted-foreground mt-1">Weekly macro digest</p>
          </Link>
        </div>

        {submitted ? (
          <motion.div
            className="rounded-xl border border-border/55 bg-card/50 p-10 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-display text-2xl font-semibold mb-2">Message Sent</h2>
            <p className="text-muted-foreground">Thank you for reaching out. I'll respond as soon as possible.</p>
          </motion.div>
        ) : (
          <motion.form
            className="rounded-xl border border-border/55 bg-card/50 p-6 sm:p-8"
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
                  className="bg-background/35"
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
                  className="bg-background/35"
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
                  className="bg-background/35"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-background/35"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="collaboration">Research Collaboration</SelectItem>
                    <SelectItem value="early-careers">Early Careers &amp; Contributing</SelectItem>
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
                className="bg-background/35"
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