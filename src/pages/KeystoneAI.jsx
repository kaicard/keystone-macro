import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Send, RotateCcw, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageBackground from '@/components/layout/PageBackground';
import ChatMessageBubble from '@/components/ailab/ChatMessageBubble';
import ChatTypingIndicator from '@/components/ailab/ChatTypingIndicator';
import KeystoneIcon from '@/components/ailab/KeystoneIcon';
import ChatHistorySidebar from '@/components/ailab/ChatHistorySidebar';

// ─── Analyst Chat ────────────────────────────────────────────────────────────

const STARTERS = [
  "Compare the main risks for equities, bonds and gold in a table.",
  "How should I position for persistent dollar strength?",
  "Walk me through the European fiscal pivot and implications for EUR assets.",
  "What does China's recovery mean for commodity markets?",
  "Is gold's rally sustainable or a positioning trade?",
  "What are the biggest macro risks investors are underpricing right now?",
  "How do you think about EM currency stress in this environment?",
  "Break down the oil supply/demand picture and geopolitical risk premium.",
];

function makeTitle(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > 45 ? clean.slice(0, 45) + '…' : clean;
}

export default function KeystoneAI() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages, loading]);

  const { data: conversations = [], isLoading: loadingConvos } = useQuery({
    queryKey: ['chatConversations'],
    queryFn: () => base44.entities.ChatConversation.list('-updated_date', 50),
    enabled: isAuthenticated,
  });

  const persistConversation = async (allMessages, userMsg) => {
    if (!isAuthenticated) return;
    if (activeId) {
      await base44.entities.ChatConversation.update(activeId, { messages: allMessages });
    } else {
      const created = await base44.entities.ChatConversation.create({
        title: makeTitle(userMsg),
        messages: allMessages,
      });
      setActiveId(created.id);
    }
    queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    const userMsgObj = { role: 'user', content: userMsg };
    const newMessages = [...messages, userMsgObj];
    setMessages(newMessages);
    setLoading(true);

    setSendError('');
    try {
      const response = await base44.functions.invoke('keystoneChat', {
        mode: 'analyst', message: userMsg, history: messages,
      });
      const reply = response?.data?.reply;
      if (!reply) throw new Error('No response was returned. Please try again.');
      const finalMessages = [...newMessages, { role: 'assistant', content: reply }];
      setMessages(finalMessages);
      persistConversation(finalMessages, userMsg).catch(err => console.error('Chat save failed:', err));
    } catch {
      setMessages(messages);
      setInput(userMsg);
      setSendError('Unable to get a response. Your question is ready to send again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleNewChat = () => {
    setSendError('');
    setMessages([]);
    setActiveId(null);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (conv) => {
    setMessages(conv.messages || []);
    setActiveId(conv.id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id) => {
    try {
      await base44.entities.ChatConversation.delete(id);
      if (id === activeId) handleNewChat();
      queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="pt-24 lg:pt-28 pb-10 min-h-screen relative">
      <PageBackground />
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${isAuthenticated ? 'lg:flex lg:gap-6' : ''}`}>

        {/* Sidebar for logged-in users */}
        {isAuthenticated && (
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-2 glass rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-4 h-4" /> History
            </button>
            <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" /> New Chat
            </Button>
          </div>
        )}

        {isAuthenticated && (
          <ChatHistorySidebar
            conversations={conversations}
            activeId={activeId}
            loading={loadingConvos}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onDelete={handleDeleteConversation}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <motion.div className="mb-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/[0.07] border border-primary/15 flex items-center justify-center">
                <KeystoneIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Keystone AI</h1>
                <p className="text-xs text-muted-foreground">Macro Intelligence Analyst</p>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-6" style={{ minHeight: 'calc(100vh - 230px)' }}>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-4 mb-6">
              <p className="text-xs font-medium text-muted-foreground">Research conversation</p>
              {isAuthenticated && messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1.5 text-muted-foreground hidden lg:flex">
                  <RotateCcw className="w-3.5 h-3.5" /> New Chat
                </Button>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {messages.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-xl border border-primary/15 bg-primary/[0.07] flex items-center justify-center mb-4">
                    <KeystoneIcon className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold mb-2">Ask the Desk</h2>
                  <p className="text-muted-foreground mb-6 max-w-md text-sm">Ask about markets, policy, positioning, or portfolio construction.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
                    {STARTERS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="rounded-lg border border-border/50 bg-background/30 px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-background/50 transition-colors duration-200">
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden space-y-8 pb-6 pr-1 sm:pr-3" style={{ maxHeight: 'calc(100dvh - 380px)' }} aria-live="polite" aria-busy={loading}>
                  {messages.map((msg, i) => <ChatMessageBubble key={i} msg={msg} />)}
                  {loading && <ChatTypingIndicator />}
                  <div ref={bottomRef} />
                </div>
              )}

              <div className="pt-4 pb-2">
                {sendError && <p role="alert" className="mb-3 text-sm text-destructive">{sendError}</p>}
                <div className="rounded-2xl border border-border bg-background p-4 flex gap-3 items-end focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                  <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Ask about macro, markets, positioning, or portfolio construction…"
                    className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm min-h-[44px] max-h-36" rows={1} />
                  <Button aria-label="Send message" onClick={() => sendMessage()} disabled={!input.trim() || loading} size="icon" className="rounded-xl h-9 w-9 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/50 text-center mt-2">
                  Keystone AI can make mistakes. Please double-check important information and verify figures before acting on them.
                </p>
                <p className="text-xs text-muted-foreground/40 text-center mt-1">
                  {isAuthenticated
                    ? 'Chats are saved to your account · For informational purposes only · Not financial advice'
                    : 'Sign in to save your chat history · For informational purposes only · Not financial advice'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}