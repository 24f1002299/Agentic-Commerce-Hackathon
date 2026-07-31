"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Zap,
  Lock,
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  Activity,
  FileText,
  Info,
  Play,
  Tag,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  ruleId: string;
  action: string;
  timestamp: string;
  pravaSessionId?: string | null;
  receiptUrl?: string | null;
  uiIcon: string;
}

interface AuditTimelineProps {
  ruleId: string;
  /** Initial logs already fetched from the rules list endpoint */
  initialLogs?: AuditLogEntry[];
  /** Current rule status from parent polling */
  currentStatus?: string;
  /** If true, the SSE stream is opened and we animate new entries live */
  liveMode?: boolean;
}

// ─── Icon + visual config per uiIcon slug ─────────────────────────────────────

interface StepConfig {
  icon: React.ReactNode;
  label: string;
  color: string;       // tailwind text + border color class
  bg: string;          // tailwind bg class for the circle
  glow: string;        // box-shadow style value
}

const STEP_CONFIG: Record<string, StepConfig> = {
  search: {
    icon: <Search className="w-3.5 h-3.5" />,
    label: "Monitoring Market",
    color: "text-blue-400 border-blue-500/50",
    bg: "bg-blue-950",
    glow: "0 0 12px rgba(59,130,246,0.5)",
  },
  activity: {
    icon: <Activity className="w-3.5 h-3.5" />,
    label: "Processing",
    color: "text-indigo-400 border-indigo-500/50",
    bg: "bg-indigo-950",
    glow: "0 0 12px rgba(99,102,241,0.5)",
  },
  zap: {
    icon: <Zap className="w-3.5 h-3.5" />,
    label: "Condition Met!",
    color: "text-amber-400 border-amber-500/50",
    bg: "bg-amber-950",
    glow: "0 0 14px rgba(251,191,36,0.6)",
  },
  lock: {
    icon: <Lock className="w-3.5 h-3.5" />,
    label: "Securing Token",
    color: "text-purple-400 border-purple-500/50",
    bg: "bg-purple-950",
    glow: "0 0 12px rgba(168,85,247,0.5)",
  },
  "credit-card": {
    icon: <CreditCard className="w-3.5 h-3.5" />,
    label: "Securing Prava Token",
    color: "text-purple-400 border-purple-500/50",
    bg: "bg-purple-950",
    glow: "0 0 12px rgba(168,85,247,0.5)",
  },
  "check-circle": {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Purchase Successful",
    color: "text-emerald-400 border-emerald-500/50",
    bg: "bg-emerald-950",
    glow: "0 0 16px rgba(16,185,129,0.6)",
  },
  "alert-triangle": {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: "Error",
    color: "text-rose-400 border-rose-500/50",
    bg: "bg-rose-950",
    glow: "0 0 12px rgba(244,63,94,0.5)",
  },
  "file-text": {
    icon: <FileText className="w-3.5 h-3.5" />,
    label: "Logged",
    color: "text-slate-400 border-slate-600/50",
    bg: "bg-slate-900",
    glow: "none",
  },
  play: {
    icon: <Play className="w-3.5 h-3.5" />,
    label: "Started",
    color: "text-blue-400 border-blue-500/50",
    bg: "bg-blue-950",
    glow: "0 0 10px rgba(59,130,246,0.4)",
  },
  tag: {
    icon: <Tag className="w-3.5 h-3.5" />,
    label: "Tagged",
    color: "text-slate-400 border-slate-600/50",
    bg: "bg-slate-900",
    glow: "none",
  },
};

const DEFAULT_STEP: StepConfig = {
  icon: <Info className="w-3.5 h-3.5" />,
  label: "Event",
  color: "text-slate-400 border-slate-700/50",
  bg: "bg-slate-900",
  glow: "none",
};

function getStepConfig(uiIcon: string): StepConfig {
  return STEP_CONFIG[uiIcon] ?? DEFAULT_STEP;
}

// ─── Single animated timeline step ───────────────────────────────────────────

function TimelineStep({
  log,
  index,
  isLast,
}: {
  log: AuditLogEntry;
  index: number;
  isLast: boolean;
}) {
  const cfg = getStepConfig(log.uiIcon);
  const isSuccess = log.uiIcon === "check-circle";
  const isError = log.uiIcon === "alert-triangle";

  return (
    <motion.div
      key={log.id}
      initial={{ opacity: 0, x: -24, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 280,
        damping: 22,
        delay: index * 0.04,
      }}
      className="relative flex gap-4 group"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[17px] top-8 bottom-0 w-px bg-gradient-to-b from-slate-700/80 to-slate-800/30" />
      )}

      {/* Icon circle */}
      <div className="relative shrink-0 mt-0.5 z-10">
        <motion.div
          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${cfg.color} ${cfg.bg} transition-all duration-300`}
          style={{ boxShadow: cfg.glow }}
          whileHover={{ scale: 1.15 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {cfg.icon}
        </motion.div>
        {/* Pulse ring on the latest step */}
        {isLast && !isSuccess && !isError && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-40 border-2 border-blue-400 pointer-events-none" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-5">
        {/* Icon label + timestamp */}
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${cfg.color.split(" ")[0]} opacity-90`}
          >
            <span className="[&>svg]:w-3 [&>svg]:h-3">{cfg.icon}</span>
            {cfg.label}
          </span>
          <span className="text-[10px] text-slate-600 font-mono ml-auto shrink-0">
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* Action text */}
        <motion.div
          className={`mt-1 px-3 py-2.5 rounded-xl text-xs leading-relaxed border transition-all duration-300 ${
            isSuccess
              ? "bg-emerald-950/40 border-emerald-500/25 text-emerald-200"
              : isError
              ? "bg-rose-950/40 border-rose-500/25 text-rose-200"
              : "bg-slate-900/60 border-slate-800/80 text-slate-300"
          }`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {log.action}
        </motion.div>

        {/* Prava session + receipt */}
        {log.pravaSessionId && (
          <motion.div
            className="mt-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex justify-between gap-2">
              <span className="text-slate-500 shrink-0">Prava Token:</span>
              <span className="text-blue-400 font-bold truncate">
                {log.pravaSessionId}
              </span>
            </div>
            {log.receiptUrl && (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">Receipt:</span>
                <a
                  href={log.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  View Receipt <CheckCircle2 className="w-3 h-3 inline" />
                </a>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}



// ─── Live SSE streaming label ─────────────────────────────────────────────────

function LivePulse({ streaming }: { streaming: boolean }) {
  if (!streaming) return null;
  return (
    <motion.div
      className="flex items-center gap-1.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wider"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      Live streaming
    </motion.div>
  );
}

// ─── Empty / loading skeleton ─────────────────────────────────────────────────

function EmptyTimeline({ connecting }: { connecting: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-slate-500 text-xs">
      {connecting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          <span>Connecting to live stream…</span>
        </>
      ) : (
        <>
          <Activity className="w-5 h-5 text-slate-700" />
          <span>No audit events yet</span>
        </>
      )}
    </div>
  );
}

// ─── Main AuditTimeline ───────────────────────────────────────────────────────

export function AuditTimeline({
  ruleId,
  initialLogs = [],
  currentStatus,
  liveMode = false,
}: AuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(initialLogs);
  const [streaming, setStreaming] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const seenRef = useRef(new Set<string>(initialLogs.map((l) => l.id)));

  // Sync if initial logs change (e.g. parent polling updates the rule)
  useEffect(() => {
    setLogs((prev) => {
      const merged = [...prev];
      for (const log of initialLogs) {
        if (!seenRef.current.has(log.id)) {
          seenRef.current.add(log.id);
          merged.push(log);
        }
      }
      return merged;
    });
  }, [initialLogs]);

  // SSE connection
  useEffect(() => {
    if (!liveMode) return;

    // Don't open a stream for already-terminal rules
    if (
      currentStatus === "SUCCESS" ||
      currentStatus === "FAILED"
    ) {
      return;
    }

    setConnecting(true);
    const es = new EventSource(`/api/stream/audit?ruleId=${encodeURIComponent(ruleId)}`);
    eventSourceRef.current = es;

    es.addEventListener("log", (e) => {
      const log = JSON.parse(e.data) as AuditLogEntry;
      setConnecting(false);
      setStreaming(true);
      setLogs((prev) => {
        if (seenRef.current.has(log.id)) return prev;
        seenRef.current.add(log.id);
        return [...prev, log];
      });
    });

    es.addEventListener("status", () => {
      setConnecting(false);
      setStreaming(true);
    });

    es.addEventListener("done", () => {
      setStreaming(false);
      es.close();
    });

    es.addEventListener("error", () => {
      setStreaming(false);
      setConnecting(false);
      es.close();
    });

    es.onerror = () => {
      setStreaming(false);
      setConnecting(false);
    };

    return () => {
      es.close();
      setStreaming(false);
      setConnecting(false);
    };
  }, [ruleId, liveMode, currentStatus]);

  const isTerminal =
    currentStatus === "SUCCESS" || currentStatus === "FAILED";

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          Autonomous Audit Trail
        </h5>
        <LivePulse streaming={streaming} />
      </div>

      {/* Timeline */}
      <div className="pl-1">
        {logs.length === 0 ? (
          <EmptyTimeline connecting={connecting} />
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-0">
              {logs.map((log, i) => (
                <TimelineStep
                  key={log.id}
                  log={log}
                  index={i}
                  isLast={i === logs.length - 1 && !isTerminal}
                />
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* "Monitoring…" pending indicator while active and no terminal */}
        {liveMode && streaming && !isTerminal && (
          <motion.div
            className="flex items-center gap-3 mt-2 pl-[52px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-500"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-500">
              Agent monitoring…
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
