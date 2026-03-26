import React, { useEffect, useRef } from 'react';

// Subtle ambient background — lighter version of the hero canvas
export default function PageBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (t) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Very subtle slow-moving orbs
      const orbs = [
        { x: 0.2 + Math.sin(t * 0.12) * 0.08, y: 0.3 + Math.cos(t * 0.09) * 0.08, r: 400, color: 'hsla(38, 80%, 55%, 0.025)' },
        { x: 0.75 + Math.cos(t * 0.1) * 0.07, y: 0.65 + Math.sin(t * 0.13) * 0.07, r: 350, color: 'hsla(210, 60%, 50%, 0.02)' },
        { x: 0.5 + Math.sin(t * 0.08 + 1) * 0.1, y: 0.15 + Math.cos(t * 0.07) * 0.06, r: 300, color: 'hsla(38, 80%, 55%, 0.015)' },
      ];

      orbs.forEach(orb => {
        const gradient = ctx.createRadialGradient(orb.x * w, orb.y * h, 0, orb.x * w, orb.y * h, orb.r);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      // Very faint grid
      const spacing = 80;
      ctx.strokeStyle = 'hsla(210, 20%, 50%, 0.018)';
      ctx.lineWidth = 0.5;

      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Single very faint chart line
      ctx.beginPath();
      ctx.strokeStyle = 'hsla(38, 80%, 55%, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 3) {
        const y = h * 0.6 +
          Math.sin(x * 0.005 + t * 0.25) * 50 +
          Math.sin(x * 0.01 + t * 0.15) * 30;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const animate = () => {
      time += 0.008; // slower than hero
      draw(time);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0, opacity: 0.8 }}
    />
  );
}