"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface SentinelProtectedErrorProps {
  /** The rule's maxBudget cap */
  budget: number;
  /** Last audit log action message, used to extract the error detail */
  lastAuditAction?: string;
  /** Optional: the actual price that caused the block */
  blockedAt?: number;
}

/**
 * Friendly, non-alarming error state shown when a purchase fails due to
 * budget enforcement. Communicates that Sentinel *protected* the user,
 * not that something went wrong catastrophically.
 */
export function SentinelProtectedError({
  budget,
  lastAuditAction,
  blockedAt,
}: SentinelProtectedErrorProps) {
  // Try to extract the exceeded price from the audit message
  const priceMatch = lastAuditAction?.match(/\$([0-9]+\.[0-9]+) exceeds/);
  const resolvedBlockedAt = blockedAt ?? (priceMatch ? parseFloat(priceMatch[1]) : null);

  // Parse a short reason from the audit log
  let reason = "Price exceeded your cap";
  if (lastAuditAction) {
    if (lastAuditAction.includes("Hard cap")) {
      reason = `Price exceeded the system safety limit of $${(60).toFixed(2)}`;
    } else if (lastAuditAction.includes("Budget violation") || lastAuditAction.includes("max budget")) {
      reason = `Price exceeded your $${budget.toFixed(2)} cap`;
    } else if (lastAuditAction.includes("Execution failed")) {
      reason = "Execution error — rule paused for safety";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-5 mb-5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3"
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
        </div>
        <div className="space-y-0.5 flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-300">
            🛡️ Sentinel protected your wallet
          </p>
          <p className="text-xs text-amber-400/80 leading-relaxed">
            {reason}. Rule paused.
          </p>
        </div>
      </div>

      {/* Detail row — shows the numbers */}
      {resolvedBlockedAt && (
        <div className="flex items-center gap-3 pl-1">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-400">Price seen:</span>
            <span className="text-rose-400 font-bold">${resolvedBlockedAt.toFixed(2)}</span>
          </div>
          <div className="h-3 w-px bg-slate-700" />
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-slate-400">Your cap:</span>
            <span className="text-emerald-400 font-bold">${budget.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Reassurance footer */}
      <p className="text-[10px] text-slate-500 italic leading-relaxed">
        No charge was made. Adjust your budget cap or wait for the price to drop, then re-activate.
      </p>
    </motion.div>
  );
}
