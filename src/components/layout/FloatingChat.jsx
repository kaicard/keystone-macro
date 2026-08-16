import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Send, RotateCcw, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const SYSTEM_PROMPT = `You are a senior macro research analyst at Keystone Macro — sharp, opinionated, and genuinely enjoyable to talk to. Today is ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.

You're having a real conversation via a chat widget. Be concise but human. Match the user's energy — casual or analytical. For market questions: give the view + 1 key risk. For casual chat: just talk naturally. No preamble, no sycophancy, no memo headers. You can be dry, witty, and push back when needed.`;

function KeystoneIcon({ className = "w-6 h-6" }) {
  const id = Math.random().toString(36).slice(2);
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`kg-${id}`} x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path d="M16 3 L28.5 9.5 L28.5 22.5 L16 29 L3.5 22.5 L3.5 9.5 Z" stroke={`url(#kg-${id})`} strokeWidth="1.4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.06" />
      <path d="M16 8 L23.5 12 L23.5 20 L16 24 L8.5 20 L8.5 12 Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeOpacity="0.35" fill="currentColor" fillOpacity="0.10" />
      <line x1="16" y1="9.5" x2="16" y2="22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.9" />
      <path d="M16 15 L21.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
      <path d="M16 15 L21.5 22.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" />
      <circle cx="16" cy="15" r="2" fill="currentColor" fillOpacity="0.9" />
      <circle cx="16" cy="15" r="3.5" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
    </svg>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }} />
      ))}
    </div>
  );
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  const buildHistory = (msgs) =>
    msgs.map(m => `${m.role === 'user' ? 'USER' : 'ANALYST'}: ${m.content}`).join('\n\n');

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setLoading(true);

    const history = buildHistory(messages);
    const prompt = `${SYSTEM_PROMPT}\n\n${history ? `HISTORY:\n${history}\n\n` : ''}USER: ${text}\n\nRespond concisely as the Keystone Macro analyst. 2-4 sentences max unless the question requires more depth.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gemini_3_flash', add_context_from_internet: true });
    const reply = typeof response === 'string' ? response : response?.response || response?.text || JSON.stringify(response);
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            onClick={() => setOpen(true)}
            className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-card/95 text-primary shadow-[0_16px_42px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all hover:border-primary/35 hover:bg-card"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
          >
            <KeystoneIcon className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-5 right-5 z-50 flex w-[380px] max-w-[calc(100vw-20px)] flex-col overflow-hidden rounded-2xl border border-border/45 bg-card/95 shadow-[0_28px_90px_-34px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            style={{ height: 'min(560px, calc(100vh - 100px))' }}
            initial={{ opacity: 0, scale: 0.85, y: 30, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border/30 bg-background/30 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <KeystoneIcon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Keystone AI</p>
                  <p className="text-[10px] text-muted-foreground">Senior Macro Analyst</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => { setOpen(false); navigate('/AI'); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <KeystoneIcon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm mb-1">Ask the Desk</p>
                  <p className="text-xs text-muted-foreground mb-4">Macro analysis, market views, positioning ideas</p>
                  <div className="space-y-2 w-full">
                    {["Fed policy and duration risk?", "Oil supply and geopolitical premium?", "Best EM trades right now?"].map(q => (
                      <button key={q} onClick={() => { setInput(q); }} className="w-full text-left text-xs text-muted-foreground hover:text-foreground glass rounded-lg px-3 py-2 transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <KeystoneIcon className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card/70 border border-border/40 rounded-tl-sm text-foreground/90'
                  }`}>
                    {msg.role === 'user' ? (
                      <p>{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="prose prose-xs dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_p]:leading-5 [&_ul]:my-1 [&_ul]:pl-0 [&_li]:my-0.5 [&_li]:flex [&_li]:gap-1.5 [&_strong]:text-foreground [&_strong]:font-semibold [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-0.5 [&_h3]:text-primary">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <KeystoneIcon className="w-3 h-3 text-primary" />
                  </div>
                  <div className="glass rounded-xl rounded-tl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border/30 p-3 bg-card/30 shrink-0">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about markets, macro, positioning…"
                  rows={1}
                  className="flex-1 resize-none bg-muted/40 rounded-xl px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring border border-border/30 min-h-[36px] max-h-24"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}