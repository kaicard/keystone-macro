import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MessageSquare, Loader2, X } from 'lucide-react';

export default function ChatHistorySidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNewChat,
  onDelete,
  open,
  onClose,
}) {
  const [confirmId, setConfirmId] = useState(null);

  const handleDelete = (id) => {
    onDelete(id);
    setConfirmId(null);
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:static top-0 left-0 h-full lg:h-auto z-50 lg:z-auto w-64 lg:w-60 shrink-0 glass border-r lg:border lg:border-border/30 lg:rounded-xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-3 border-b border-border/20">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Chat History</span>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground/50" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground/40 text-center px-3 py-6">No conversations yet</p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeId === c.id ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                }`}
                onClick={() => onSelect(c)}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                <span className="flex-1 text-xs truncate">{c.title}</span>
                {confirmId === c.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                      className="text-red-400 hover:text-red-300"
                      title="Confirm delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}
                      className="text-muted-foreground hover:text-foreground"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmId(c.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all shrink-0"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}