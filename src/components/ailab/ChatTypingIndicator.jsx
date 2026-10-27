import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ChatTypingIndicator() {
  return <div role="status" className="flex items-center gap-2 py-3 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Preparing your response...</div>;
}