import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Sparkles, Send, RotateCcw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageBackground from '@/components/layout/PageBackground';
import ReactMarkdown from 'react-markdown';

const SYSTEM_PROMPT = `You are a senior macro research analyst at Keystone Macro, a premier institutional research platform. You have deep expertise across:

- Global macroeconomics (Fed, ECB, BOJ, BOE policy; inflation dynamics; growth cycles)
- Fixed income (yield curves, duration, credit spreads, sovereign debt)
- Equities (sector rotation, factor investing, earnings cycles, valuation)
- Commodities (oil, gold, metals, agricultural; supply/demand dynamics)
- FX (DXY, G10, EM; carry trade; capital flows)
- Geopolitics (sanctions, trade policy, war risk, political cycles)
- M&A and corporate strategy
- Portfolio construction and asset allocation

Your tone is precise, direct, and institutional — like a Goldman Sachs or BlackRock research note. You give concrete views, not hedged non-answers. You reference specific data, levels, and catalysts. You always consider cross-asset implications. You are rigorous, analytical, and confident in your views while acknowledging key risks.

When asked about markets or macro, always provide:
1. Your base case view with supporting data
2. Key risks to that view
3. How you'd position (instruments to watch or trade)
4. What would change your mind

Keep responses concise but substantive. Use markdown headers and bullet points for clarity.`;

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

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-primary text-primary-foreground rounded-tr-sm'
          : 'glass rounded-tl-sm text-foreground'
      }`}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5 [&_strong]:text-foreground"
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-muted-foreground">
          You
        </div>
      )}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/60"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  );
}

export default function KeystoneAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const buildHistory = (msgs) =>
    msgs.map(m => `${m.role === 'user' ? 'USER' : 'ANALYST'}: ${m.content}`).join('\n\n');

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const history = buildHistory(messages);
    const prompt = `${SYSTEM_PROMPT}

${history ? `CONVERSATION HISTORY:\n${history}\n\n` : ''}USER: ${userMsg}

Respond as the Keystone Macro senior analyst. Be direct, data-driven, and institutional. Use markdown for structure when appropriate.`;

    const response = await base44.integrations.Core.InvokeLLM({ prompt, model: 'claude_sonnet_4_6' });
    const reply = typeof response === 'string' ? response : response?.response || response?.text || JSON.stringify(response);

    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => { setMessages([]); setInput(''); };

  return (
    <div className="pt-20 lg:pt-24 pb-6 min-h-screen relative flex flex-col">
      <PageBackground />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col flex-1 relative z-10">

        {/* Header */}
        <motion.div className="mb-6 flex items-center justify-between" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">Keystone AI</h1>
              <p className="text-xs text-muted-foreground">Senior Macro Research Analyst</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" /> New Chat
            </Button>
          )}
        </motion.div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0">
          {messages.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-semibold mb-2">Ask the Desk</h2>
              <p className="text-muted-foreground mb-8 max-w-md text-sm">
                Institutional-grade macro analysis on demand. Ask about markets, policy, positioning, or portfolio construction.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
                {STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="glass rounded-xl px-4 py-3 text-left text-sm text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all duration-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Input */}
          <div className="pt-4 pb-2">
            <div className="glass rounded-2xl p-3 flex gap-3 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about macro, markets, positioning, or portfolio construction…"
                className="resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-sm min-h-[44px] max-h-36"
                rows={1}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                size="icon"
                className="rounded-xl h-9 w-9 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/40 text-center mt-2">
              Powered by Keystone Macro AI · For informational purposes only · Not financial advice
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}