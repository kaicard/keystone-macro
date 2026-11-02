import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';

export default function EditorialEmailTests({ user }) {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  if (user?.id !== '69b9efd1e34861737a4d8958') return null;
  const sendSamples = async () => {
    setSending(true);
    setError('');
    setResult(null);
    try {
      const { data } = await base44.functions.invoke('sendEditorialEmailTests', { confirm_test_only: true });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to send the samples.');
    } finally {
      setSending(false);
    }
  };
  return (
    <section className="mb-8 border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display text-xl">Editorial Paper email samples</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Send 12 sample emails only to your owner address. Includes welcomes, morning and evening briefs, the free weekly digest, cancellations, contact and account emails. Live automatic emails remain unchanged.</p>
      <Button type="button" onClick={sendSamples} disabled={sending} className="mt-4 gap-2">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {sending ? 'Sending samples...' : 'Send all 12 samples to me'}
      </Button>
      {result && <div role="status" className="mt-4 text-sm">
        <p>{result.accepted} of {result.requested} samples accepted for sending to {result.recipient}. Inbox delivery is not yet confirmed.</p>
        {result.results?.filter(item => !item.accepted).map(item => <p key={item.type} className="mt-1 text-destructive">{item.type}: {item.reason}</p>)}
      </div>}
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  );
}