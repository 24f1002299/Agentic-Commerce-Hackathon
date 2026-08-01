"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck } from "lucide-react";

interface PurchaseSuccessOverlayProps {
  visible: boolean;
  itemName: string;
  amount: number;
  onDone: () => void;
}

// Lightweight canvas confetti — no extra library needed
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const COLORS = [
      "#34d399", // emerald
      "#60a5fa", // blue
      "#a78bfa", // violet
      "#f9a8d4", // pink
      "#fbbf24", // amber
    ];

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      color: string; size: number;
      rotation: number; rotationSpeed: number;
      opacity: number;
    };

    const particles: Particle[] = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.9) * 14,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 7 + 3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
    }));

    let frame = 0;
    let animId: number;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35;
        p.vx *= 0.98;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;
        if (p.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      frame++;
      if (frame < 140) animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

export function PurchaseSuccessOverlay({
  visible,
  itemName,
  amount,
  onDone,
}: PurchaseSuccessOverlayProps) {
  // Auto-dismiss after 3.5 s
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="success-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          {/* Dimmed backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onDone}
          />

          {/* Success card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900/95 shadow-2xl shadow-emerald-900/30 backdrop-blur-xl z-10"
          >
            {/* Canvas confetti burst */}
            <ConfettiCanvas />

            {/* Top green gradient bar */}
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

            <div className="p-8 flex flex-col items-center gap-5 text-center">
              {/* Animated checkmark ring */}
              <div className="relative">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.25, 1], opacity: 1 }}
                  transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
                  className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.25, damping: 12, stiffness: 300 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                </motion.div>
                {/* Radiating glow ring */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.8, opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border border-emerald-400/50"
                />
              </div>

              {/* Text content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="space-y-1.5"
              >
                <p className="text-xl font-extrabold text-slate-100">Purchase Complete!</p>
                <p className="text-sm text-emerald-400 font-semibold">{itemName}</p>
                <p className="text-2xl font-mono font-bold text-slate-100">${amount.toFixed(2)}</p>
              </motion.div>

              {/* Sentinel attribution pill */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800/60 border border-slate-700/60 rounded-full px-3 py-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Authorized by Sentinel · Prava Mandate
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
