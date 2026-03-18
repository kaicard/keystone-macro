import React, { useEffect, useRef } from 'react';

export default function HeroBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

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

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      };
    };
    canvas.addEventListener('mousemove', handleMouse);

    const drawGrid = (t) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      
      ctx.clearRect(0, 0, w, h);

      // Animated gradient orbs
      const orbs = [
        { x: 0.3 + Math.sin(t * 0.3) * 0.1, y: 0.4 + Math.cos(t * 0.2) * 0.1, r: 300, color: 'hsla(38, 80%, 55%, 0.06)' },
        { x: 0.7 + Math.cos(t * 0.25) * 0.1, y: 0.6 + Math.sin(t * 0.35) * 0.1, r: 250, color: 'hsla(210, 60%, 50%, 0.05)' },
        { x: mx * 0.3 + 0.35, y: my * 0.3 + 0.35, r: 200, color: 'hsla(38, 80%, 55%, 0.04)' },
      ];

      orbs.forEach(orb => {
        const gradient = ctx.createRadialGradient(orb.x * w, orb.y * h, 0, orb.x * w, orb.y * h, orb.r);
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      // Grid lines
      const spacing = 60;
      ctx.strokeStyle = 'hsla(210, 20%, 50%, 0.04)';
      ctx.lineWidth = 0.5;

      for (let x = 0; x < w; x += spacing) {
        const offset = Math.sin(t * 0.5 + x * 0.01) * 2;
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing) {
        const offset = Math.cos(t * 0.5 + y * 0.01) * 2;
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(w, y + offset);
        ctx.stroke();
      }

      // Animated chart line
      ctx.beginPath();
      ctx.strokeStyle = 'hsla(38, 80%, 55%, 0.12)';
      ctx.lineWidth = 1.5;
      for (let x = 0; x < w; x += 2) {
        const y = h * 0.5 + 
          Math.sin(x * 0.008 + t * 0.6) * 40 + 
          Math.sin(x * 0.015 + t * 0.3) * 25 +
          Math.cos(x * 0.003 + t * 0.2) * 60;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Second chart line
      ctx.beginPath();
      ctx.strokeStyle = 'hsla(210, 60%, 50%, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 2) {
        const y = h * 0.55 + 
          Math.sin(x * 0.006 + t * 0.4 + 1) * 35 + 
          Math.cos(x * 0.012 + t * 0.25) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Floating dots
      for (let i = 0; i < 5; i++) {
        const dx = (Math.sin(t * 0.3 + i * 1.5) * 0.3 + 0.5) * w;
        const dy = (Math.cos(t * 0.2 + i * 2) * 0.3 + 0.5) * h;
        const pulse = Math.sin(t + i) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(dx, dy, 2 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 80%, 55%, ${0.15 + pulse * 0.15})`;
        ctx.fill();
      }
    };

    const animate = () => {
      time += 0.016;
      drawGrid(time);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'auto' }}
    />
  );
}