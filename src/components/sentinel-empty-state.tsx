"use client";

import { motion } from "framer-motion";
import { Sparkles, Bot, ArrowDown } from "lucide-react";

interface SentinelEmptyStateProps {
  onScrollToInput?: () => void;
}

export function SentinelEmptyState({ onScrollToInput }: SentinelEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Animated SVG Illustration */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-blue-500/20 blur-2xl"
        />

        {/* Main illustration container */}
        <div className="relative w-40 h-40 mx-auto">
          <svg
            viewBox="0 0 160 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Outer orbit ring */}
            <motion.circle
              cx="80" cy="80" r="70"
              stroke="url(#orbitGradient)"
              strokeWidth="1"
              strokeDasharray="8 6"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "80px 80px" }}
            />

            {/* Inner orbit ring */}
            <motion.circle
              cx="80" cy="80" r="52"
              stroke="url(#orbitGradient2)"
              strokeWidth="1"
              strokeDasharray="5 8"
              animate={{ rotate: -360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "80px 80px" }}
            />

            {/* Shield body */}
            <motion.path
              d="M80 24 L108 36 L108 72 Q108 96 80 108 Q52 96 52 72 L52 36 Z"
              fill="url(#shieldGradient)"
              stroke="url(#shieldStroke)"
              strokeWidth="1.5"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Shield inner glow */}
            <motion.path
              d="M80 32 L102 42 L102 70 Q102 90 80 100 Q58 90 58 70 L58 42 Z"
              fill="url(#shieldInner)"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Bot face / eye circle */}
            <motion.circle
              cx="80" cy="65" r="10"
              fill="rgba(96, 165, 250, 0.2)"
              stroke="#60a5fa"
              strokeWidth="1.5"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Eye pupil */}
            <motion.circle
              cx="80" cy="65" r="4"
              fill="#60a5fa"
              animate={{ y: [0, -3, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Scanning line */}
            <motion.line
              x1="64" y1="79" x2="96" y2="79"
              stroke="rgba(96, 165, 250, 0.4)"
              strokeWidth="1"
              strokeLinecap="round"
              animate={{ y: [0, -3, 0], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Orbiting dots */}
            <motion.circle
              cx="80" cy="10" r="4"
              fill="#a78bfa"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "80px 80px" }}
            />
            <motion.circle
              cx="80" cy="150" r="3"
              fill="#34d399"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "80px 80px" }}
            />
            <motion.circle
              cx="10" cy="80" r="3"
              fill="#f472b6"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "80px 80px" }}
            />

            {/* Sparkle stars */}
            <motion.g
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              style={{ transformOrigin: "118px 34px" }}
            >
              <line x1="118" y1="30" x2="118" y2="38" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="114" y1="34" x2="122" y2="34" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            </motion.g>
            <motion.g
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              style={{ transformOrigin: "38px 50px" }}
            >
              <line x1="38" y1="46" x2="38" y2="54" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="34" y1="50" x2="42" y2="50" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
            </motion.g>

            {/* Gradient definitions */}
            <defs>
              <linearGradient id="orbitGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="orbitGradient2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="shieldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(59,130,246,0.25)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0.15)" />
              </linearGradient>
              <linearGradient id="shieldInner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(59,130,246,0.12)" />
                <stop offset="100%" stopColor="rgba(139,92,246,0.06)" />
              </linearGradient>
              <linearGradient id="shieldStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="space-y-3 max-w-sm"
      >
        <h3 className="text-xl font-bold text-slate-100 tracking-tight">
          No Sentinels Active
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Your autonomous commerce agents are standing by. Create your first Sentinel to start monitoring and auto-purchasing items on your behalf.
        </p>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex flex-wrap justify-center gap-2 mt-5"
      >
        {[
          { icon: "🤖", label: "AI-Powered" },
          { icon: "⚡", label: "Autonomous" },
          { icon: "🔒", label: "Passkey-Secured" },
          { icon: "📊", label: "Audit Logged" },
        ].map((pill) => (
          <span
            key={pill.label}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-400 text-[11px] font-medium"
          >
            <span>{pill.icon}</span>
            {pill.label}
          </span>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="mt-7 flex flex-col items-center gap-3"
      >
        <button
          onClick={onScrollToInput}
          className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-900/40 transition-all duration-200 hover:scale-[1.03] hover:shadow-blue-700/50"
        >
          <Sparkles className="w-4 h-4" />
          Create your first Sentinel
          <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
        </button>
        <p className="text-[11px] text-slate-600">
          Just describe what you want to buy in plain English ✦
        </p>
      </motion.div>
    </motion.div>
  );
}
