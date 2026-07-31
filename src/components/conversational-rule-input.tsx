"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  Bot,
  DollarSign,
  Globe,
  Zap,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  CornerDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface ParsedRuleData {
  targetItem: string;
  maxBudget: number;
  trigger: string;
  naturalLanguageQuery: string;
}

interface ConversationalRuleInputProps {
  onRuleCreated?: (rule: any) => void;
}

const EXAMPLE_PROMPTS = [
  "Buy indigo.dev under $60",
  "Acquire dev.io if price drops under $120",
  "Monitor tech.ai and buy under $50",
];

export function ConversationalRuleInput({ onRuleCreated }: ConversationalRuleInputProps) {
  const [prompt, setPrompt] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedRule, setParsedRule] = useState<ParsedRuleData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Editable fields for confirmation card
  const [editableTarget, setEditableTarget] = useState("");
  const [editableBudget, setEditableBudget] = useState<number | string>("");
  const [editableTrigger, setEditableTrigger] = useState("");

  const handleParseRule = async (customPrompt?: string) => {
    const query = customPrompt || prompt;
    if (!query.trim()) {
      toast.error("Please enter a natural language rule prompt");
      return;
    }

    setAnalyzing(true);
    setParsedRule(null);

    try {
      const response = await fetch("/api/parse-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze rule");
      }

      const parsed: ParsedRuleData = data.parsed;
      setParsedRule(parsed);
      setEditableTarget(parsed.targetItem);
      setEditableBudget(parsed.maxBudget);
      setEditableTrigger(parsed.trigger);

      toast.success("Rule analyzed by Agent", {
        description: `Source: ${data.source === 'openai' ? 'OpenAI AI Model' : 'Smart Heuristic Engine'}`,
      });
    } catch (err: any) {
      console.error("Rule parsing error:", err);
      toast.error("Analysis Failed", {
        description: err.message || "Could not parse your rule prompt.",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmRule = async () => {
    if (!editableTarget.trim()) {
      toast.error("Target item cannot be empty");
      return;
    }
    const numBudget = typeof editableBudget === "string" ? parseFloat(editableBudget) : editableBudget;
    if (isNaN(numBudget) || numBudget <= 0) {
      toast.error("Please provide a valid budget greater than $0");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naturalLanguageQuery: parsedRule?.naturalLanguageQuery || prompt,
          targetItem: editableTarget.trim(),
          maxBudget: numBudget,
          userId: "usr_alex_rivera_demo",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create rule");
      }

      toast.success("Rule Registered & Drafted!", {
        description: `Please authorize the security mandate to start monitoring ${editableTarget}.`,
      });

      if (onRuleCreated) {
        onRuleCreated(data.rule);
      }

      // Reset state for new input
      setPrompt("");
      setParsedRule(null);
    } catch (err: any) {
      console.error("Confirm rule error:", err);
      toast.error("Rule Activation Failed", {
        description: err.message || "Failed to save rule to database.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setParsedRule(null);
    setPrompt("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <AnimatePresence mode="wait">
        {/* State 1 & 2: Chat Input or Typing Indicator */}
        {!parsedRule && (
          <motion.div
            key="input-section"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Chat Bar Container */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none" />
              <div className="relative flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
                <div className="pl-3 pr-2 text-blue-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !analyzing) {
                      handleParseRule();
                    }
                  }}
                  disabled={analyzing}
                  placeholder="Tell the agent what to buy or monitor... e.g. Buy indigo.dev under $60"
                  className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-sm focus:outline-none px-2 py-2"
                />
                <Button
                  onClick={() => handleParseRule()}
                  disabled={analyzing || !prompt.trim()}
                  variant="glow"
                  size="sm"
                  className="rounded-xl px-4 gap-2 flex-shrink-0"
                >
                  {analyzing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Analyze</span>
                      <CornerDownLeft className="w-3.5 h-3.5 opacity-70" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Analyzing Typing Indicator UX */}
            {analyzing ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-3 py-4 px-6 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-sm font-medium backdrop-blur-md shadow-lg"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                </div>
                <span className="tracking-wide">Agent is analyzing your request...</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                </div>
              </motion.div>
            ) : (
              /* Suggestion Pills */
              <div className="flex flex-wrap items-center gap-2 pt-1 px-1">
                <span className="text-xs text-slate-400 font-medium">Try asking:</span>
                {EXAMPLE_PROMPTS.map((exPrompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPrompt(exPrompt);
                      handleParseRule(exPrompt);
                    }}
                    className="text-xs px-3 py-1 rounded-full bg-slate-800/80 hover:bg-blue-950/60 border border-slate-700/60 hover:border-blue-500/40 text-slate-300 hover:text-blue-300 transition-all duration-200"
                  >
                    "{exPrompt}"
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* State 3: Editable Rule Summary Confirmation Card */}
        {parsedRule && (
          <motion.div
            key="summary-card"
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="glass-card border-blue-500/40 shadow-2xl overflow-hidden relative">
              {/* Top Accent Gradient Bar */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

              <CardHeader className="border-b border-slate-800/80 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        Rule Summary Card
                        <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          Draft Extracted
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Review and adjust parameters before activating agent monitoring
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Reset
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-5">
                {/* Natural Language Prompt Preview */}
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-300">Original Request: </span>
                    <span className="italic text-slate-200">"{parsedRule.naturalLanguageQuery}"</span>
                  </div>
                </div>

                {/* Editable Parameters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Field 1: Target Item */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      Target Item / Asset
                    </label>
                    <Input
                      value={editableTarget}
                      onChange={(e) => setEditableTarget(e.target.value)}
                      placeholder="e.g. indigo.dev"
                      className="bg-slate-950/80 border-slate-700/80 focus:border-blue-500 font-mono text-sm text-slate-100"
                    />
                  </div>

                  {/* Field 2: Max Budget */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      Max Budget ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={editableBudget}
                        onChange={(e) => setEditableBudget(e.target.value)}
                        placeholder="60.00"
                        className="pl-7 bg-slate-950/80 border-slate-700/80 focus:border-emerald-500 font-mono text-sm text-slate-100"
                      />
                    </div>
                  </div>

                  {/* Field 3: Trigger Condition */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Trigger Condition
                    </label>
                    <Input
                      value={editableTrigger}
                      onChange={(e) => setEditableTrigger(e.target.value)}
                      placeholder="e.g. Price drops below $60.00"
                      className="bg-slate-950/80 border-slate-700/80 focus:border-amber-500 text-xs text-slate-100"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-5 border-t border-slate-800/80 bg-slate-950/50">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pre-authorized via Prava Autonomous Commerce Security</span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="glow"
                    size="sm"
                    onClick={handleConfirmRule}
                    disabled={submitting}
                    className="gap-2 px-5"
                  >
                    {submitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    )}
                    <span>Confirm & Activate Rule</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
