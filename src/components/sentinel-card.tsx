"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Activity,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
  Check,
  Zap,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditTimeline } from "@/components/audit-timeline";
import { SentinelProtectedError } from "@/components/sentinel-protected-error";

interface AuditLog {
  id: string;
  ruleId: string;
  action: string;
  timestamp: string;
  pravaSessionId?: string | null;
  receiptUrl?: string | null;
  uiIcon: string;
}

interface Rule {
  id: string;
  userId: string;
  naturalLanguageQuery: string;
  targetItem: string;
  maxBudget: number;
  status: "PENDING_APPROVAL" | "ACTIVE" | "TRIGGERED" | "SUCCESS" | "FAILED";
  auditLogs?: AuditLog[];
  createdAt: string;
  updatedAt: string;
}

interface SentinelCardProps {
  rule: Rule;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (id: string | null) => void;
  onApprove: (id: string) => void;
}

const STATUS_CONFIG = {
  ACTIVE: {
    label: "Active & Monitoring",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    glow: "shadow-emerald-900/20",
    borderAccent: "border-t-emerald-500/40",
    icon: <Activity className="w-3.5 h-3.5" />,
    pulse: true,
  },
  PENDING_APPROVAL: {
    label: "Awaiting Approval",
    dot: "bg-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    glow: "shadow-amber-900/20",
    borderAccent: "border-t-amber-500/40",
    icon: <Clock className="w-3.5 h-3.5" />,
    pulse: false,
  },
  TRIGGERED: {
    label: "Executing Purchase",
    dot: "bg-purple-400",
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    glow: "shadow-purple-900/20",
    borderAccent: "border-t-purple-500/40",
    icon: <Zap className="w-3.5 h-3.5" />,
    pulse: true,
  },
  SUCCESS: {
    label: "Purchase Complete",
    dot: "bg-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    glow: "shadow-emerald-900/20",
    borderAccent: "border-t-emerald-500/40",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    pulse: false,
  },
  FAILED: {
    label: "Sentinel Protected",
    dot: "bg-amber-400",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    glow: "shadow-amber-900/20",
    borderAccent: "border-t-amber-500/40",
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    pulse: false,
  },
};

export function SentinelCard({ rule, index, isExpanded, onToggleExpand, onApprove }: SentinelCardProps) {
  const config = STATUS_CONFIG[rule.status];
  const auditCount = rule.auditLogs?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      layout
      className={`group relative rounded-2xl border bg-slate-950/40 overflow-hidden transition-all duration-300 ${
        isExpanded
          ? "border-blue-500/40 shadow-xl shadow-blue-900/20"
          : "border-slate-800 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50 hover:-translate-y-0.5"
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${
        rule.status === "ACTIVE" ? "from-emerald-500 via-teal-500 to-emerald-600" :
        rule.status === "PENDING_APPROVAL" ? "from-amber-500 via-yellow-500 to-amber-600" :
        rule.status === "TRIGGERED" ? "from-purple-500 via-indigo-500 to-purple-600" :
        rule.status === "SUCCESS" ? "from-emerald-500 via-green-500 to-emerald-600" :
        "from-rose-500 via-red-500 to-rose-600"
      }`} />

      {/* Card main content */}
      <div
        onClick={() => onToggleExpand(isExpanded ? null : rule.id)}
        className="p-5 cursor-pointer select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left: Icon + Status */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className={`shrink-0 p-2.5 rounded-xl border ${
              rule.status === "ACTIVE" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              rule.status === "PENDING_APPROVAL" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
              rule.status === "TRIGGERED" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
              rule.status === "SUCCESS" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Target + Status Badge Row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
                  {config.pulse && (
                    <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse inline-block`} />
                  )}
                  {config.icon}
                  {config.label}
                </span>
              </div>

              {/* Target item — primary text */}
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <h4 className="font-bold text-slate-100 text-base leading-tight truncate">
                  {rule.targetItem}
                </h4>
              </div>

              {/* Natural language query */}
              <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-1">
                &ldquo;{rule.naturalLanguageQuery}&rdquo;
              </p>

              {/* Meta row: ID + audit count */}
              <div className="flex items-center gap-3 pt-0.5">
                <span className="font-mono text-[9px] text-slate-600">
                  {rule.id.slice(0, 8)}…
                </span>
                {auditCount > 0 && (
                  <span className="text-[9px] text-slate-600 flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" />
                    {auditCount} event{auditCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Budget + Actions */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2 shrink-0">
            {/* Budget pill */}
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Max Budget</p>
              <p className="font-mono font-bold text-lg text-slate-100 leading-tight">
                ${rule.maxBudget.toFixed(2)}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {rule.status === "PENDING_APPROVAL" && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove(rule.id);
                  }}
                  size="sm"
                  className="h-8 gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-0 shadow-md shadow-blue-900/40"
                >
                  <Lock className="w-3 h-3" />
                  <span className="hidden sm:inline">Approve</span>
                  <Check className="w-3 h-3 sm:hidden" />
                </Button>
              )}
              <div className={`p-1.5 rounded-lg transition-all ${isExpanded ? "bg-slate-800 text-blue-400" : "text-slate-600 group-hover:text-slate-400"}`}>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Friendly Sentinel wallet-protection error — always visible on FAILED cards */}
      {rule.status === "FAILED" && (() => {
        const lastFailLog = rule.auditLogs
          ?.slice()
          .reverse()
          .find((l) => l.uiIcon === "alert-triangle" || l.action.includes("exceeded") || l.action.includes("violation") || l.action.includes("blocked") || l.action.includes("failed") || l.action.includes("Failed"));
        return (
          <SentinelProtectedError
            budget={rule.maxBudget}
            lastAuditAction={lastFailLog?.action}
          />
        );
      })()}

      {/* Expanded audit timeline */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="border-t border-slate-800/80 bg-slate-950/60 px-5 py-5"
        >
          <AuditTimeline
            ruleId={rule.id}
            initialLogs={rule.auditLogs as any}
            currentStatus={rule.status}
            liveMode={["ACTIVE", "TRIGGERED"].includes(rule.status)}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
