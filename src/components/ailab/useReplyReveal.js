import { useCallback, useEffect, useRef } from 'react';

export default function useReplyReveal(setMessages) {
  const task = useRef(null);
  const cancelReveal = useCallback(() => {
    if (!task.current) return;
    clearInterval(task.current.timer);
    task.current.resolve(false);
    task.current = null;
  }, []);

  useEffect(() => cancelReveal, [cancelReveal]);

  const revealReply = useCallback((previous, reply) => {
    cancelReveal();
    const words = reply.match(/\S+\s*|\s+/g) || [];
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0 : Math.min(4500, Math.max(300, words.length * 12));
    const started = performance.now();
    return new Promise(resolve => {
      let shown = -1;
      const tick = () => {
        const count = duration === 0 ? words.length : Math.min(words.length,
          Math.max(1, Math.floor((performance.now() - started) / duration * words.length)));
        if (count !== shown) {
          shown = count;
          setMessages([...previous, { role: 'assistant', content: words.slice(0, count).join('') }]);
        }
        if (count === words.length) {
          clearInterval(task.current.timer);
          task.current = null;
          resolve(true);
        }
      };
      task.current = { resolve, timer: setInterval(tick, 24) };
      tick();
    });
  }, [cancelReveal, setMessages]);

  return { revealReply, cancelReveal };
}