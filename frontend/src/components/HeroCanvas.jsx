import { useEffect, useRef } from 'react';

/**
 * Subtle interactive architectural visual: a receding colonnade of arches
 * drawn on canvas with mouse parallax, scroll drift and a slow ambient sway.
 * Respects prefers-reduced-motion (renders one static frame).
 */
export default function HeroCanvas({ className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;
    const ctx = rawCtx;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;
    let scrollY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      ty = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };
    const onTouch = (e) => {
      if (!e.touches.length) return;
      const t = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      tx = ((t.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      ty = ((t.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
    };
    const onScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const BEIGE = '230, 217, 191';
    const CLAY = '163, 74, 82';
    const WINE = '196, 110, 116';

    function draw(t) {
      mx += (tx - mx) * 0.045;
      my += (ty - my) * 0.045;
      const drift = reduced ? 0 : Math.sin(t / 2600) * 6;
      const parallax = Math.min(120, scrollY * 0.12);

      ctx.clearRect(0, 0, w, h);

      // faint horizon grid
      ctx.save();
      ctx.strokeStyle = `rgba(${BEIGE},0.10)`;
      ctx.lineWidth = 1;
      const horizon = h * 0.86;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(w, horizon);
      ctx.stroke();
      for (let i = 0; i <= 12; i++) {
        const x = (w / 12) * i;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, horizon);
        ctx.lineTo(w / 2 + (x - w / 2) * 0.25, h);
        ctx.stroke();
      }
      ctx.restore();

      const layers = 7;
      const cxBase = w * 0.62;
      const baseY = h * 0.88 - parallax * 0.4;
      for (let k = layers - 1; k >= 0; k--) {
        const depth = k / (layers - 1); // 0 front .. 1 back
        const scale = 1 - depth * 0.62;
        const cx = cxBase + mx * (10 + depth * 34) + drift * depth;
        const cy = baseY - my * (4 + depth * 12) + parallax * depth * 0.35;
        const aw = Math.max(30, w * 0.42 * scale);
        const ah = Math.max(40, h * 0.66 * scale);
        const legTop = cy - ah;
        const alpha = 0.16 + (1 - depth) * 0.5;
        const isAccent = k === 2;
        ctx.save();
        ctx.strokeStyle = isAccent ? `rgba(${WINE},${Math.min(1, alpha + 0.25)})` : `rgba(${BEIGE},${alpha})`;
        ctx.lineWidth = isAccent ? 2 : 1 + (1 - depth) * 1.2;
        // arch: two legs + semicircle top
        ctx.beginPath();
        ctx.moveTo(cx - aw / 2, cy);
        ctx.lineTo(cx - aw / 2, legTop + aw / 2);
        ctx.arc(cx, legTop + aw / 2, aw / 2, Math.PI, 0);
        ctx.lineTo(cx + aw / 2, cy);
        ctx.stroke();
        // inner echo arch
        if (k % 2 === 0) {
          ctx.globalAlpha = 0.5;
          const inset = 14 * scale + 6;
          ctx.beginPath();
          ctx.moveTo(cx - aw / 2 + inset, cy);
          ctx.lineTo(cx - aw / 2 + inset, legTop + aw / 2 + inset * 0.4);
          ctx.arc(cx, legTop + aw / 2 + inset * 0.4, aw / 2 - inset, Math.PI, 0);
          ctx.lineTo(cx + aw / 2 - inset, cy);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }

      // floating keystone disc (wine accent)
      ctx.save();
      const dx = cxBase - w * 0.34 + mx * 22 + (reduced ? 0 : Math.sin(t / 1800) * 8);
      const dy = h * 0.3 + my * 14 + (reduced ? 0 : Math.cos(t / 2200) * 10) - parallax * 0.2;
      const r = Math.max(26, Math.min(54, w * 0.045));
      ctx.strokeStyle = `rgba(${CLAY},0.9)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(${CLAY},0.16)`;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
      // roman numeral XI ticks
      ctx.fillStyle = `rgba(${BEIGE},0.85)`;
      ctx.font = `${Math.max(11, r * 0.42)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('XI', dx, dy + 1);
      ctx.restore();

      // small orbiting markers
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const ang = (reduced ? i * 2.1 : t / 4000 + (i * Math.PI * 2) / 3);
        const ox = dx + Math.cos(ang) * (r + 16 + i * 7);
        const oy = dy + Math.sin(ang) * (r + 16 + i * 7) * 0.62;
        ctx.fillStyle = `rgba(${BEIGE},${0.5 - i * 0.12})`;
        ctx.beginPath();
        ctx.arc(ox, oy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (reduced) {
      draw(0);
    } else {
      const loop = (t) => {
        draw(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
