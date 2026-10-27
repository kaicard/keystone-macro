import React from 'react';
import ChatMarkdown from '@/components/ailab/ChatMarkdown';
import KeystoneIcon from '@/components/ailab/KeystoneIcon';

export default function ChatMessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex min-w-0 justify-end">
        <div className="max-w-[90%] rounded-2xl rounded-tr-sm border border-border bg-muted px-4 py-3 text-sm leading-7 text-foreground sm:max-w-[80%]">
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>
      </div>
    );
  }
  return (
    <article className="min-w-0 w-full" aria-label="Keystone AI response">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <KeystoneIcon className="h-4 w-4 text-primary" />Keystone AI
      </div>
      <ChatMarkdown content={msg.content} />
    </article>
  );
}