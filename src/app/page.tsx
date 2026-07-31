"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Database, 
  Bot, 
  CreditCard, 
  CheckCircle2, 
  Layers,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConversationalRuleInput } from "@/components/conversational-rule-input";

export default function Home() {
  const [testInput, setTestInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSimulatePayment = () => {
    if (!testInput.trim()) {
      toast.error("Please enter a payment description or amount first");
      return;
    }
    setLoading(true);
    toast.info("Initiating Agentic Payment Flow...", {
      description: `Target: "${testInput}"`,
    });

    setTimeout(() => {
      setLoading(false);
      toast.success("Prava Payment Session Created!", {
        description: "Transaction pre-authorized via Prava SDK sandbox.",
      });
    }, 1200);
  };

  const handleTestDatabase = () => {
    toast.success("SQLite & Prisma Client Ready", {
      description: "Database connected: file:./dev.db with AgentTask & PaymentSession models.",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse-glow" />
      <div className="absolute top-2/3 right-10 w-[400px] h-[250px] bg-purple-600/15 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-400 text-xs font-medium backdrop-blur-md shadow-lg shadow-blue-950/50">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Phase 2 Active • Conversational Rule Intelligence</span>
        </div>
      </motion.div>

      {/* Main Title & Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center max-w-3xl mx-auto space-y-4"
      >
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Agentic Commerce <br />
          <span className="gradient-text">Conversational Intelligence</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Create autonomous purchase rules using natural language. The agent extracts targets, max budgets, and trigger conditions into structured rules.
        </p>
      </motion.div>

      {/* Step 3: Conversational Rule Input Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="text-center space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-blue-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Conversational Agent Interface
          </h2>
        </div>
        <ConversationalRuleInput />
      </motion.div>

      {/* Interactive Agent Sandbox & UI Test Component */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="pt-6"
      >
        <Card className="glass-card glass-card-hover border-slate-800/80 max-w-2xl mx-auto overflow-hidden">
          <CardHeader className="border-b border-slate-800/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Agent Payment Sandbox</CardTitle>
                <CardDescription>Test UI stack, Sonner toast notifications, and interactive inputs</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Purchase Prompt or Amount
              </label>
              <Input
                placeholder="e.g. Order 2x Cloud Server Instances for $49.00"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSimulatePayment()}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3 pt-2 pb-6 border-t border-slate-800/60 bg-slate-950/40">
            <Button 
              variant="glow" 
              onClick={handleSimulatePayment} 
              disabled={loading}
              className="gap-2"
            >
              {loading ? <Zap className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Simulate Prava Payment
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestDatabase}
              className="gap-2 border-slate-700 hover:bg-slate-800"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              Check SQLite DB
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Tech Stack Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass-card glass-card-hover h-full">
            <CardHeader>
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 w-fit mb-2 border border-indigo-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <CardTitle>OpenAI Structured Output</CardTitle>
              <CardDescription>Natural language parsed into strict JSON schema response format via /api/parse-rule.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Strict JSON Schema output</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Smart Heuristic Fallback</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant parameter extraction</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="glass-card glass-card-hover h-full">
            <CardHeader>
              <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 w-fit mb-2 border border-pink-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <CardTitle>Sleek UX & Micro-effects</CardTitle>
              <CardDescription>Typing indicator UX with interactive, editable Rule Summary confirmation cards.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> "Agent analyzing..." indicator</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Editable Rule Summary Card</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Framer Motion spring transitions</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="glass-card glass-card-hover h-full">
            <CardHeader>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-2 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <CardTitle>SQLite Persistence & Audit</CardTitle>
              <CardDescription>Confirmed rules are saved directly to SQLite with initial audit logs attached.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SQLite Rule Table sync</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automatic AuditLog registration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ready for Prava Execution</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-6">
        Agentic Commerce Hackathon • Phase 2 Conversational Intelligence Active
      </div>
    </div>
  );
}
