import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Send, RotateCcw, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageBackground from '@/components/layout/PageBackground';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import KeystoneIcon from '@/components/ailab/KeystoneIcon';
import ChatHistorySidebar from '@/components/ailab/ChatHistorySidebar';

// ─── Analyst Chat ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior macro research analyst at Keystone Macro — sharp, opinionated, and genuinely enjoyable to talk to. You have deep expertise in global macro, fixed income, equities, commodities, FX, and geopolitics.

You are having a real conversation, not writing a report. Match the user's energy: if they're casual, be casual. If they want depth, go deep. If they're just chatting or asking something non-financial, engage naturally like a human would — with wit, curiosity, and warmth.

RESPONSE RULES:
- Conversational first. You're a brilliant analyst who also happens to be a real person. No robotic outputs.
- For market/macro questions: give a concrete view. Base case, 1-2 risks, what to watch. Use **bold** for key terms.
- For casual chat, jokes, or general questions: just respond naturally. Don't force finance into everything.
- Keep responses appropriately sized — short for simple questions, longer only when genuinely needed.
- No preamble, no "great question", no sycophancy. Just talk.
- No lengthy disclaimers. 
- NEVER use memo/report headers (TO:, FROM:, DATE:, RE:, MEMORANDUM, etc). This is a chat.
- Use markdown headers (##) sparingly — only for genuinely multi-section answers.
- You can have opinions, be a little dry/witty, and push back if someone says something wrong.`;

const STARTERS = [
  "What's your view on Fed policy and duration risk in 2025?",
  "How should I position for persistent dollar strength?",
  "Walk me through the European fiscal pivot and implications for EUR assets.",
  "What does China's recovery mean for commodity markets?",
  "Is gold's rally sustainable or a positioning trade?",
  "What are the biggest macro risks investors are underpricing right now?",
  "How do you think about EM currency stress in this environment?",
  "Break down the oil supply/demand picture and geopolitical risk premium.",
];

const markdownComponents = {
  h2: ({ children }) => <h2 className="text-sm font-semibold mt-4 mb-2 text-foreground border-b border-border/30 pb-1">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-semibold mt-3 mb-1.5 text-primary uppercase tracking-wide">{children}</h3>,
  p: ({ children }) => <p className="text-sm leading-6 text-foreground/90 mb-2.5 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-1 pl-4 list-decimal">{children}</ol>,
  li: ({ children }) => (
    <li className="flex items-start gap-2 text-sm text-foreground/85 leading-5.5">
      <span className="mt-1.5 w-1 h-1 rounded-full bg-primary/50 shrink-0" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 pl-3 border-l-2 border-primary/40 text-muted-foreground text-sm italic">{children}</blockquote>
  ),
  code: ({ inline, children }) => inline
    ? <code className="px-1 py-0.5 rounded bg-muted text-xs font-mono text-primary">{children}</code>
    : <pre className="my-3 p-3 rounded-lg bg-muted/60 overflow-x-auto text-xs font-mono leading-relaxed">{children}</pre>,
  hr: () => <hr className="my-3 border-border/30" />,
};

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-1">
          <KeystoneIcon className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={`rounded-xl ${
        isUser
          ? 'max-w-[72%] px-4 py-2.5 bg-primary text-primary-foreground rounded-tr-sm text-sm leading-relaxed'
          : 'w-full max-w-[90%] px-4 py-3.5 bg-card/60 border border-border/40 rounded-tl-sm'
      }`}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <KeystoneIcon className="w-4 h-4 text-primary" />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
        ))}
      </div>
    </div>
  );
}

function makeTitle(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > 45 ? clean.slice(0, 45) + '…' : clean;
}

export default function KeystoneAI() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: conversations = [], isLoading: loadingConvos } = useQuery({
    queryKey: ['chatConversations'],
    queryFn: () => base44.entities.ChatConversation.list('-updated_date', 50),
    enabled: isAuthenticated,
  });

  const buildHistory = (msgs) => msgs.map(m => `${m.role === 'user' ? 'USER' : 'ANALYST'}: ${m.content}`).join('\n\n');

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
    const history = buildHistory(messages);

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const prompt = `${SYSTEM_PROMPT}\n\nToday is ${today}.\n\n${history ? `HISTORY:\n${history}\n\n` : ''}USER: ${userMsg}\n\nRespond concisely. Prioritise signal over length.`;
    const response = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gemini_3_flash' });
    const reply = typeof response === 'string' ? response : response?.response || response?.text || JSON.stringify(response);
    const finalMessages = [...newMessages, { role: 'assistant', content: reply }];
    setMessages(finalMessages);
    setLoading(false);

    // Persist for logged-in users only
    persistConversation(finalMessages, userMsg).catch(err => console.error('Chat save failed:', err));
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const handleNewChat = () => {
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
    <div className="pt-20 lg:pt-24 pb-10 min-h-screen relative">
      <PageBackground />
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 ${isAuthenticated ? 'lg:flex lg:gap-6' : ''}`}>

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
          <motion.div className="mb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                <KeystoneIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold">Keystone AI</h1>
                <p className="text-xs text-muted-foreground">Macro Intelligence Analyst</p>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 220px)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Institutional-grade macro analysis on demand.</p>
              {isAuthenticated && messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1.5 text-muted-foreground hidden lg:flex">
                  <RotateCcw className="w-3.5 h-3.5" /> New Chat
                </Button>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {messages.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <KeystoneIcon className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold mb-2">Ask the Desk</h2>
                  <p className="text-muted-foreground mb-6 max-w-md text-sm">Ask about markets, policy, positioning, or portfolio construction.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
                    {STARTERS.map(s => (
                      <button key={s} onClick={() => sendMessage(s)}
                        className="glass rounded-xl px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all duration-200">
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-6 pb-4 pr-1" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                  {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
                  {loading && <TypingIndicator />}
                  <div ref={bottomRef} />
                </div>
              )}

              <div className="pt-4 pb-2">
                <div className="glass rounded-2xl p-3 flex gap-3 items-end">
                  <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder="Ask about macro, markets, positioning, or portfolio construction…"
                    className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm min-h-[44px] max-h-36" rows={1} />
                  <Button onClick={() => sendMessage()} disabled={!input.trim() || loading} size="icon" className="rounded-xl h-9 w-9 shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/40 text-center mt-2">
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