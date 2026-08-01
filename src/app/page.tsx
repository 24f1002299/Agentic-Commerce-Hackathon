"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sliders,
  Globe,
  RefreshCw,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Lock,
  Tag,
  AlertTriangle,
  Activity,
  FileText,
  Info,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConversationalRuleInput } from "@/components/conversational-rule-input";
import { AuditTimeline } from "@/components/audit-timeline";
import { SentinelCard } from "@/components/sentinel-card";
import { SentinelEmptyState } from "@/components/sentinel-empty-state";
import { PurchaseSuccessOverlay } from "@/components/purchase-success-overlay";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  inStock: boolean;
  category: string;
}

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

export default function Home() {
  const conversationalInputRef = useRef<HTMLDivElement>(null);
  const scrollToInput = () => {
    conversationalInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  // Store & API states
  const [products, setProducts] = useState<Product[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [domainMocks, setDomainMocks] = useState<{ [domain: string]: boolean }>({});
  
  // Interactive UI states
  const [activeTab, setActiveTab] = useState<"storefront" | "domains" | "rules" | "json">("storefront");
  const [domainInput, setDomainInput] = useState("");
  const [domainChecking, setDomainChecking] = useState(false);
  const [domainResult, setDomainResult] = useState<any>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  
  // Agent loop states
  const [isAgentRunning, setIsAgentRunning] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState<string>("");
  const [jsonViewerContent, setJsonViewerContent] = useState<any>(null);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Passkey / Mandate Approval states
  const [mandateRule, setMandateRule] = useState<Rule | null>(null);
  const [mandateLoading, setMandateLoading] = useState(false);
  const [passkeyStatus, setPasskeyStatus] = useState<"idle" | "creating_mandate" | "triggering_passkey" | "verifying" | "success" | "error">("idle");
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [pravaHostedUrl, setPravaHostedUrl] = useState<string | null>(null);

  // Success overlay state
  const [successOverlay, setSuccessOverlay] = useState<{ visible: boolean; itemName: string; amount: number }>({
    visible: false, itemName: "", amount: 0
  });
  // Track previously-seen SUCCESS rule ids to detect new transitions
  const seenSuccessIds = useRef<Set<string>>(new Set());

  // Load initial data
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      // 1. Fetch rules
      const rulesRes = await fetch("/api/rules");
      const rulesData = await rulesRes.json();
      if (rulesData.success) {
        setRules(rulesData.rules);
      }

      // 2. Fetch products
      const prodRes = await fetch("/api/mock-store/products");
      const prodData = await prodRes.json();
      if (prodData.success) {
        setProducts(prodData.products);
        // Set json viewer default content
        if (activeTab === "storefront" || !jsonViewerContent) {
          setJsonViewerContent({
            endpoint: "/api/mock-store/products",
            status: prodRes.status,
            data: prodData
          });
        }
      }

      setLastCheckTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error loading mock simulator data:", err);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, jsonViewerContent]);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle product updates
  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    setUpdatingProductId(id);
    try {
      const res = await fetch("/api/mock-store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Updated ${data.product.name}`, {
          description: `Price: $${data.product.price.toFixed(2)} • Stock: ${data.product.inStock ? "In Stock" : "Out of Stock"}`
        });
        
        // Update local state
        setProducts(prev => prev.map(p => p.id === id ? data.product : p));
        setJsonViewerContent({
          endpoint: "/api/mock-store/products (POST update)",
          status: res.status,
          data
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error("Failed to update product", { description: err.message });
    } finally {
      setUpdatingProductId(null);
    }
  };

  // Reset store
  const handleResetStore = async () => {
    try {
      const res = await fetch("/api/mock-store/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" })
      });
      const data = await res.json();
      if (data.success) {
        toast.info("Storefront reset to defaults");
        fetchData();
      }
    } catch (err: any) {
      toast.error("Reset failed", { description: err.message });
    }
  };

  // Check custom domain
  const handleCheckDomain = async (domainToCheck?: string) => {
    const target = domainToCheck || domainInput;
    if (!target.trim()) {
      toast.error("Please enter a domain name");
      return;
    }
    setDomainChecking(true);
    setDomainResult(null);
    try {
      const res = await fetch(`/api/check-domain?domain=${encodeURIComponent(target.trim())}`);
      const data = await res.json();
      if (data.success) {
        setDomainResult(data);
        setJsonViewerContent({
          endpoint: `/api/check-domain?domain=${target.trim()}`,
          status: res.status,
          data
        });
        
        toast.info(`Domain check completed for ${data.domain}`, {
          description: data.available ? "Domain is AVAILABLE!" : "Domain is registered/taken."
        });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error("Domain check failed", { description: err.message });
    } finally {
      setDomainChecking(false);
    }
  };

  // Toggle persistent domain mock
  const handleToggleDomainMock = async (domain: string, makeAvailable: boolean) => {
    try {
      const res = await fetch("/api/check-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, available: makeAvailable })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mock override applied for ${domain}`, {
          description: makeAvailable ? "Mocked as AVAILABLE" : "Mocked as REGISTERED/TAKEN"
        });
        
        setDomainMocks(prev => ({ ...prev, [domain.toLowerCase()]: makeAvailable }));
        
        // Re-check if checking the current domain
        if (domainInput.toLowerCase().trim() === domain.toLowerCase()) {
          handleCheckDomain(domain);
        }
      }
    } catch (err: any) {
      toast.error("Override failed", { description: err.message });
    }
  };

  // Approve and activate a pending rule (opens the Security Mandate Passkey Confirmation Modal)
  const handleApproveRule = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      setMandateRule(rule);
      setPasskeyStatus("idle");
      setPasskeyError(null);
    }
  };

  const runPasskeyFlow = async (rule: Rule) => {
    setMandateLoading(true);
    setPasskeyStatus("creating_mandate");
    setPasskeyError(null);
    setPravaHostedUrl(null);

    // Open the tab while this function still runs directly from the user's
    // click. Browsers may block a tab opened only after an awaited fetch.
    const approvalWindow = typeof window !== "undefined"
      ? window.open("about:blank", "_blank")
      : null;

    try {
      // 1. Create mandate on backend
      const mandateRes = await fetch("/api/prava/create-mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleId: rule.id,
          maxBudget: rule.maxBudget,
          targetItem: rule.targetItem,
          userId: rule.userId
        })
      });

      const mandateData = await mandateRes.json();
      if (!mandateRes.ok || !mandateData.success) {
        throw new Error(mandateData.error || "Failed to initialize Prava mandate.");
      }

      const { sessionId, iframeUrl, isMock, pravaCustomerId } = mandateData;
      if (!sessionId) {
        throw new Error("Prava did not return a mandate setup session.");
      }

        // 2. Open Prava's hosted checkout at the top level. This gives the
        // browser a normal passkey context and keeps the card UI out of our
        // constrained modal/iframe.
      setPasskeyStatus("triggering_passkey");

      let mandateId: string | null = null;
      if (isMock) {
        // Local development without a secret key remains demonstrable, but is
        // explicitly marked as simulated and never presented as live Prava.
        toast.info("Using simulated Prava approval", {
          description: "Add a sk_test_… key to use the real hosted approval surface."
        });
        await new Promise(resolve => setTimeout(resolve, 1200));
      } else {
        if (!iframeUrl) {
          throw new Error("Prava did not return the hosted approval URL.");
        }

        setPravaHostedUrl(iframeUrl);
        if (approvalWindow) {
          approvalWindow.location.href = iframeUrl;
        } else {
          toast.warning("Your browser blocked the Prava tab", {
            description: "Use the Open Prava approval link in this dialog.",
          });
        }

        // The hosted success event and the mandate list are eventually
        // consistent, so allow a short window for the active mandate to appear.
        for (let attempt = 0; attempt < 150; attempt += 1) {
          const statusRes = await fetch(
            `/api/prava/mandate-status?userId=${encodeURIComponent(pravaCustomerId || rule.userId)}&amount=${encodeURIComponent(rule.maxBudget)}`
          );
          const statusData = await statusRes.json();
          if (!statusRes.ok || !statusData.success) {
            throw new Error(statusData.error || "Failed to check Prava mandate status.");
          }

          if (statusData.status === "active" && statusData.mandateId) {
            mandateId = statusData.mandateId;
            approvalWindow?.close();
            break;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!mandateId) {
          throw new Error("Prava approval timed out. Complete the approval in the Prava tab and try again.");
        }
      }

      // 3. Verify mandate & activate rule
      setPasskeyStatus("verifying");

      const actionMessage = isMock
        ? `Prava Mandate authorized in sandbox mock mode. Rule activated.`
        : `Prava Mandate authorized via Prava's secure hosted passkey surface. Rule activated.`;

      const updateRes = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleId: rule.id,
           status: "ACTIVE",
           action: actionMessage,
           uiIcon: "lock",
           // The charge endpoint needs the mdt_… id, not the sess_… setup id.
           pravaSessionId: mandateId || sessionId
         })
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok || !updateData.success) {
        throw new Error(updateData.error || "Failed to activate rule on backend.");
      }

      setPasskeyStatus("success");
      toast.success("Mandate Authorized!", {
        description: `Sentinel is now actively monitoring ${rule.targetItem} with limit of $${rule.maxBudget.toFixed(2)}.`
      });

       setTimeout(() => {
         setMandateRule(null);
         setPasskeyStatus("idle");
         setPravaHostedUrl(null);
         fetchData(true);
       }, 1000);

    } catch (err: any) {
      console.error("Passkey mandate flow error:", err);
      setPasskeyStatus("error");
      setPasskeyError(err.message || "An unknown error occurred during mandate signature.");
    } finally {
      setMandateLoading(false);
    }
  };

  // Autonomous Payment Execution Engine — calls /api/execute-purchase
  const triggerRulePurchase = useCallback(async (rule: Rule, matchedDetail: string, triggerSource: "store" | "domain") => {
    try {
      toast.info(`Sentinel executing purchase for: "${rule.targetItem}"`, {
        description: `${matchedDetail}. Generating Prava payment token...`,
        duration: 5000
      });

      // Call the canonical execution endpoint — enforces budget cap, calls Prava SDK,
      // dispatches to mock storefront/domain, updates DB to SUCCESS.
      const res = await fetch("/api/execute-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId: rule.id })
      });

      const data = await res.json();

      if (data.success) {
        setSuccessOverlay({
          visible: true,
          itemName: rule.targetItem,
          amount: data.purchaseAmount ?? rule.maxBudget,
        });
        fetchData(true);
      } else {
        // Friendly Sentinel wallet-protection message
        const isBudgetBlock =
          data.error?.includes("exceeds") ||
          data.error?.includes("budget") ||
          data.error?.includes("cap");
        if (isBudgetBlock) {
          toast.warning(
            `🛡️ Sentinel protected your wallet`,
            {
              description: `Price exceeded your $${rule.maxBudget.toFixed(2)} cap. Rule paused — no charge made.`,
              duration: 8000,
            }
          );
        } else {
          toast.error(`Purchase blocked`, {
            description: data.error,
            duration: 7000
          });
        }
        fetchData(true);
      }
    } catch (err: any) {
      console.error("Error calling /api/execute-purchase:", err);
      toast.error("Execution engine error", { description: err.message });
    }
  }, [fetchData]);

  // Agent loop monitor: runs checks against rules to sync UI in real-time
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const rulesRes = await fetch("/api/rules");
        const rulesData = await rulesRes.json();
        
        const prodRes = await fetch("/api/mock-store/products");
        const prodData = await prodRes.json();

        if (rulesData.success && prodData.success) {
          const newRules: Rule[] = rulesData.rules;
          
          // Detect newly-completed SUCCESS transitions for the overlay
          newRules.forEach((r) => {
            if (r.status === "SUCCESS" && !seenSuccessIds.current.has(r.id)) {
              seenSuccessIds.current.add(r.id);
              // Only pop overlay if we haven't shown it yet (first transition)
              setSuccessOverlay((prev) => {
                if (prev.visible) return prev; // don't interrupt an active overlay
                const amount = r.auditLogs
                  ?.slice()
                  .reverse()
                  .find((l) => l.uiIcon === "check-circle");
                return {
                  visible: true,
                  itemName: r.targetItem,
                  amount: r.maxBudget,
                };
              });
            } else if (r.status === "SUCCESS") {
              seenSuccessIds.current.add(r.id);
            }
          });

          setRules(newRules);
          setProducts(prodData.products);
          setLastCheckTime(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Error syncing monitor data:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Dynamic Rule Status Badge Styling — matches DESIGN.md §5.6
  const getStatusBadge = (status: Rule["status"]) => {
    switch (status) {
      case "ACTIVE":
        // success-muted bg, success text, pulsing dot
        return "border rounded-full px-[10px] h-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.5px]" +
               " bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.3)]";
      case "PENDING_APPROVAL":
        return "border rounded-full px-[10px] h-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.5px]" +
               " bg-[rgba(245,158,11,0.15)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]";
      case "TRIGGERED":
        return "border rounded-full px-[10px] h-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.5px] animate-pulse" +
               " bg-[rgba(99,102,241,0.15)] text-[#6366F1] border-[rgba(99,102,241,0.3)]";
      case "SUCCESS":
        return "border rounded-full px-[10px] h-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.5px]" +
               " bg-[rgba(16,185,129,0.15)] text-[#10B981] border-[rgba(16,185,129,0.3)]";
      case "FAILED":
        return "border rounded-full px-[10px] h-6 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.5px]" +
               " bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]";
    }
  };

  const getLogIcon = (iconName: string) => {
    switch (iconName) {
      case "search":
      case "activity":
        return <Activity className="w-3.5 h-3.5" />;
      case "credit-card":
        return <CreditCard className="w-3.5 h-3.5" />;
      case "check-circle":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "file-text":
        return <FileText className="w-3.5 h-3.5" />;
      case "lock":
        return <Lock className="w-3.5 h-3.5" />;
      case "tag":
        return <Tag className="w-3.5 h-3.5" />;
      case "play":
        return <Play className="w-3.5 h-3.5" />;
      default:
        return <Info className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="relative min-h-screen px-4 py-8 sm:py-12 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 sm:space-y-12">

      {/* Header Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-center"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium" style={{borderColor:'rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.08)',color:'var(--accent)'}}>
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          <span>Sentinel is watching for you</span>
        </div>
      </motion.div>

      {/* Main Title & Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center max-w-3xl mx-auto space-y-4"
      >
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Agentic Commerce <br />
          <span className="gradient-text">Conversational Intelligence</span>
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Create autonomous purchase rules using natural language. The agent extracts targets, max budgets, and trigger conditions into structured rules.
        </p>
      </motion.div>

      {/* Conversational Rule Input Section */}
      <motion.div
        ref={conversationalInputRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="text-center space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5" style={{color:'var(--accent)'}}>
            <Sparkles className="w-4 h-4" /> Tell Sentinel what to watch for
          </h2>
        </div>
        <ConversationalRuleInput onRuleCreated={(rule) => {
          fetchData(true);
          if (rule) {
            setMandateRule(rule);
            setPasskeyStatus("idle");
            setPasskeyError(null);
          }
        }} />
      </motion.div>

      {/* ===== SENTINEL DASHBOARD GRID ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.28 }}
        className="space-y-5"
      >
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{color:'var(--text-primary)'}}>
              <ShieldCheck className="w-5 h-5" style={{color:'var(--accent)'}} />
              Active Sentinels
            </h2>
            <p className="text-xs text-slate-500">
              {rules.length === 0
                ? "No sentinels created yet"
                : `${rules.length} sentinel${rules.length !== 1 ? "s" : ""} registered · ${rules.filter(r => r.status === "ACTIVE").length} monitoring`}
            </p>
          </div>

          {/* Live pulse indicator */}
          {rules.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider rounded-full px-3 py-1.5 w-fit" style={{color:'var(--success)',background:'var(--success-muted)',border:'1px solid rgba(16,185,129,0.3)'}}>
              <span className="w-2 h-2 rounded-full animate-ping inline-block" style={{background:'var(--success)'}} />
              Sentinel Active
            </div>
          )}
        </div>

        {/* Grid or Empty State */}
        {rules.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-950/30 overflow-hidden">
            <SentinelEmptyState onScrollToInput={scrollToInput} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rules.map((rule, i) => (
              <SentinelCard
                key={rule.id}
                rule={rule}
                index={i}
                isExpanded={expandedRule === rule.id}
                onToggleExpand={setExpandedRule}
                onApprove={handleApproveRule}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Trigger & Simulator Control Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="pt-4"
      >
        <Card className="glass-card border-slate-800 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Mock Storefront & Domain Simulator</CardTitle>
                  <CardDescription className="text-xs">Adjust backend values to satisfy active agent purchase rules and trigger purchases</CardDescription>
                </div>
              </div>

              {/* Agent Status Panel */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2 px-3 text-xs w-fit">
                <button 
                  onClick={() => setIsAgentRunning(!isAgentRunning)}
                  className={`flex items-center gap-1.5 font-semibold transition-all ${isAgentRunning ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {isAgentRunning ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <Play className="w-3 h-3 fill-current" />
                      <span>AGENT ONLINE (POLLING)</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 fill-current" />
                      <span>AGENT PAUSED</span>
                    </>
                  )}
                </button>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <span className="text-slate-400">Checked: {lastCheckTime || "Never"}</span>
                <Button 
                  onClick={() => fetchData()} 
                  variant="ghost" 
                  size="icon" 
                  className={`w-6 h-6 hover:bg-slate-800 text-slate-400 ${refreshing ? "animate-spin text-blue-400" : ""}`}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Dashboard Tabs Navigation */}
            <div className="tabs-scroll mt-4 border-t border-slate-800/80 pt-4">
              {(["storefront", "domains", "rules", "json"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    // Update json inspector state
                    if (tab === "json" && !jsonViewerContent) {
                      setJsonViewerContent({
                        message: "Select products or test domain to inspect dynamic JSON response"
                      });
                    }
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg uppercase tracking-wider border transition-all ${
                    activeTab === tab
                      ? "border-[rgba(99,102,241,0.4)] text-[#818CF8]"
                      : "border-transparent bg-transparent hover:bg-[#1A1A1E]"
                  }`}
                  style={activeTab === tab ? {background:'rgba(99,102,241,0.1)',color:'#818CF8'} : {color:'var(--text-secondary)'}}
                >
                  {tab === "storefront" && "🛍️ Storefront Products"}
                  {tab === "domains" && "🌐 Domain Checker"}
                  {tab === "rules" && `🤖 Active Rules (${rules.length})`}
                  {tab === "json" && "📄 Clean JSON Inspector"}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* Tab 1: Mock Storefront */}
              {activeTab === "storefront" && (
                <motion.div
                  key="storefront"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Mock Product Catalog</h3>
                    <Button 
                      onClick={handleResetStore} 
                      variant="outline" 
                      size="sm" 
                      className="text-xs border-slate-800 text-slate-400 hover:bg-slate-900"
                    >
                      Reset Store Values
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <div 
                        key={product.id}
                        className={`p-4 rounded-xl border bg-slate-950/40 flex flex-col justify-between transition-all ${
                          product.inStock ? "border-slate-800" : "border-slate-900/60 opacity-60"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] uppercase font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/50">
                              {product.category}
                            </span>
                            <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                              product.inStock 
                                ? "bg-emerald-950/60 text-emerald-400 border-emerald-900/50" 
                                : "bg-rose-950/60 text-rose-400 border-rose-900/50"
                            }`}>
                              {product.inStock ? "In Stock" : "Sold Out"}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-sm text-slate-200 leading-snug line-clamp-1">{product.name}</h4>
                          
                          {/* Price Tag UI */}
                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="text-lg font-mono font-bold text-slate-100">${product.price.toFixed(2)}</span>
                            <span className="text-xs font-mono text-slate-500 line-through">${product.originalPrice.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Interactive Controls */}
                        <div className="pt-4 border-t border-slate-900 mt-4 space-y-3">
                          {/* Stock Toggle Switch */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Stock Availability</span>
                            <button
                              onClick={() => handleUpdateProduct(product.id, { inStock: !product.inStock })}
                              disabled={updatingProductId === product.id}
                              className={`w-10 h-5 rounded-full p-0.5 transition-all duration-200 ${
                                product.inStock ? "bg-emerald-600" : "bg-slate-800"
                              }`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                                product.inStock ? "translate-x-5" : "translate-x-0"
                              }`} />
                            </button>
                          </div>

                          {/* Price Changer */}
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="text-slate-400">Set Mock Price ($)</span>
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={product.price}
                              onBlur={(e) => {
                                const newPrice = parseFloat(e.target.value);
                                if (!isNaN(newPrice) && newPrice !== product.price) {
                                  handleUpdateProduct(product.id, { price: newPrice });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const newPrice = parseFloat((e.target as HTMLInputElement).value);
                                  if (!isNaN(newPrice)) {
                                    handleUpdateProduct(product.id, { price: newPrice });
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }
                              }}
                              className="w-20 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded px-2 py-1 text-right text-slate-100 font-mono focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tab 2: Domain Checker Simulator */}
              {activeTab === "domains" && (
                <motion.div
                  key="domains"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Live Query Checker */}
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        Live Domain Availability Checker
                      </h3>
                      <p className="text-xs text-slate-400">
                        Query standard registrar directories using live RDAP protocol. If RDAP is blocked/slow, uses standard Node DNS resolve fallback.
                      </p>

                      <div className="flex gap-2">
                        <Input 
                          placeholder="e.g. indigo.dev, example.com"
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCheckDomain()}
                          className="bg-slate-900 border-slate-800 font-mono text-sm"
                        />
                        <Button 
                          onClick={() => handleCheckDomain()}
                          disabled={domainChecking}
                          variant="glow"
                          className="gap-2 shrink-0"
                        >
                          {domainChecking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                          Check
                        </Button>
                      </div>

                      {domainResult && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border flex flex-col gap-2 ${
                            domainResult.available 
                              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
                              : "bg-rose-950/30 border-rose-500/30 text-rose-300"
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="font-mono text-sm">{domainResult.domain}</span>
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-900 border">
                              {domainResult.available ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  Available for Purchase
                                </>
                              ) : (
                                <>
                                  <X className="w-3.5 h-3.5 text-rose-400" />
                                  Already Registered
                                </>
                              )}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Source: <strong className="uppercase">{domainResult.source}</strong></span>
                            <span>Details: {domainResult.details}</span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Persistent Mocks Simulator */}
                    <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/40 space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-400" />
                        Trigger Override Simulator
                      </h3>
                      <p className="text-xs text-slate-400">
                        Force-simulate domains as "available" to test agent triggers immediately without waiting for real-world drop events.
                      </p>

                      <div className="space-y-3">
                        {["indigo.dev", "dev.io", "tech.ai"].map((dom) => {
                          const isAvail = domainMocks[dom] || false;
                          return (
                            <div key={dom} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                              <span className="font-mono font-bold text-xs text-slate-200">{dom}</span>
                              <div className="flex items-center gap-4">
                                <span className={`text-[10px] uppercase font-bold ${isAvail ? "text-emerald-400" : "text-rose-400"}`}>
                                  {isAvail ? "Available (Mocked)" : "Registered (Taken)"}
                                </span>
                                <button
                                  onClick={() => handleToggleDomainMock(dom, !isAvail)}
                                  className={`w-9 h-5 rounded-full p-0.5 transition-all duration-200 ${
                                    isAvail ? "bg-emerald-600" : "bg-slate-800"
                                  }`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                                    isAvail ? "translate-x-4" : "translate-x-0"
                                  }`} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tab 3: Active Rules */}
              {activeTab === "rules" && (
                <motion.div
                  key="rules"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Rules database inside sqlite</h3>
                    <span className="text-[10px] text-slate-400">Click a rule card to expand transaction logs & audit history</span>
                  </div>

                  {rules.length === 0 ? (
                    <div className="rounded-xl border border-slate-800/60 bg-slate-950/20 overflow-hidden">
                      <SentinelEmptyState onScrollToInput={scrollToInput} />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rules.map((rule) => {
                        const isExpanded = expandedRule === rule.id;
                        return (
                          <div 
                            key={rule.id}
                            className={`border rounded-xl overflow-hidden transition-all bg-slate-950/30 ${
                              isExpanded ? "border-blue-500/40" : "border-slate-800 hover:border-slate-700/80"
                            }`}
                          >
                            {/* Rule Header Card Summary */}
                            <div 
                              onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer hover:bg-slate-900/30 transition-all select-none"
                            >
                              <div className="space-y-1.5 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-[10px] text-slate-500">{rule.id}</span>
                                  <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(rule.status)}`}>
                                    {rule.status === "ACTIVE" ? "ACTIVE & MONITORING" : rule.status}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-200">
                                  Monitor: <span className="text-blue-400">{rule.targetItem}</span>
                                </h4>
                                <p className="text-xs italic text-slate-400 font-medium">"{rule.naturalLanguageQuery}"</p>
                              </div>

                              <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                                <div className="text-right space-y-1">
                                  <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Max Budget</span>
                                  <span className="font-mono font-bold text-slate-100 text-sm">${rule.maxBudget.toFixed(2)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {rule.status === "PENDING_APPROVAL" && (
                                    <Button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleApproveRule(rule.id);
                                      }}
                                      variant="glow" 
                                      size="sm"
                                      className="h-8 gap-1.5 text-xs"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Approve
                                    </Button>
                                  )}
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                </div>
                              </div>
                            </div>

                            {/* Rule Audit Log Timeline Expansion — Live SSE */}
                            {isExpanded && (
                              <div className="border-t border-slate-900 bg-slate-950/60 p-5">
                                <AuditTimeline
                                  ruleId={rule.id}
                                  initialLogs={rule.auditLogs as any}
                                  currentStatus={rule.status}
                                  liveMode={["ACTIVE", "TRIGGERED"].includes(rule.status)}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tab 4: Clean JSON Inspector */}
              {activeTab === "json" && (
                <motion.div
                  key="json"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <CodeIcon className="w-4 h-4 text-emerald-400" />
                      Clean JSON API Response Viewer
                    </h3>
                    <span className="text-[10px] text-slate-400">Response output formatted for frontend binding</span>
                  </div>

                  {jsonViewerContent ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden">
                      <div className="bg-slate-900 p-2 border-b border-slate-800 flex items-center justify-between px-4 text-slate-400">
                        <span className="font-semibold text-blue-400">{jsonViewerContent.endpoint}</span>
                        <span>HTTP {jsonViewerContent.status || 200}</span>
                      </div>
                      <pre className="p-4 text-slate-300 overflow-x-auto max-h-96 leading-relaxed select-all">
                        {JSON.stringify(jsonViewerContent.data || jsonViewerContent, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-slate-800 rounded-xl bg-slate-950/20 text-slate-400 text-sm">
                      Select or interact with other tabs to inspect JSON API responses in real time.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
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

      {/* Prava Dashboard — Live Transactions Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="pt-4"
      >
        <Card className="glass-card border-slate-800 shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-800/80 bg-slate-950/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Prava Dashboard — Completed Transactions</CardTitle>
                <CardDescription className="text-xs">Live view of autonomous purchases executed via Prava single-use payment tokens</CardDescription>
              </div>
              <div className="ml-auto flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span className="text-emerald-400">Sandbox Live</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {rules.filter(r => r.status === "SUCCESS").length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 text-slate-400 text-sm space-y-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-slate-600" />
                <p>No completed transactions yet.</p>
                <p className="text-xs text-slate-500">Approve an active rule and satisfy its conditions to trigger an autonomous purchase.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.filter(r => r.status === "SUCCESS").map(rule => {
                  const successLog = rule.auditLogs?.find(l => l.uiIcon === "check-circle");
                  const tokenLog = rule.auditLogs?.find(l => l.uiIcon === "credit-card" && l.pravaSessionId);
                  return (
                    <div key={rule.id} className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-100">{rule.targetItem}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{rule.id}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">SUCCESS</span>
                          <p className="text-xs text-slate-400 font-mono">${rule.maxBudget.toFixed(2)} max</p>
                        </div>
                      </div>

                      {/* Safe Prava charge reference (never render card credentials) */}
                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono space-y-1.5">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <CreditCard className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-400 uppercase tracking-wider font-bold text-[9px]">Prava Charge</span>
                        </div>
                        {tokenLog?.pravaSessionId ? (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Mandate reference:</span>
                            <span className="text-blue-400 font-bold truncate max-w-[200px]">{tokenLog.pravaSessionId}</span>
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">Credential details are kept server-side</div>
                        )}
                        {successLog?.receiptUrl && (
                          <div className="flex justify-between items-center border-t border-slate-900 pt-1.5">
                            <span className="text-slate-500">Receipt:</span>
                            <a
                              href={successLog.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                            >
                              View Receipt <CheckCircle2 className="w-3 h-3 inline" />
                            </a>
                          </div>
                        )}
                        <div className="flex justify-between items-center border-t border-slate-900 pt-1.5">
                          <span className="text-slate-500">Status:</span>
                          <span className="text-emerald-400 font-bold">CAPTURED ✓</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Reported to Prava:</span>
                          <span className="text-emerald-400">APPROVED</span>
                        </div>
                      </div>

                      {successLog && (
                        <p className="text-[10px] text-slate-400 italic">{successLog.action}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Prava Passkey Approval Modal — DESIGN.md §4 + §8 ─────────────────
           Calm, trust-focused. Budget is the visual anchor. No warnings.
           ──────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mandateRule && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop — spec: rgba(0,0,0,0.6) + blur(4px) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!mandateLoading) setMandateRule(null); }}
              className="absolute inset-0 backdrop-blur-[4px]"
              style={{ background: 'rgba(0,0,0,0.65)' }}
            />

            {/* Modal — spec: 440px max, 16px radius, --bg-elevated */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="passkey-modal relative w-full sm:max-w-[440px] max-h-[calc(100vh-24px)] overflow-y-auto overflow-x-hidden z-10"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px 16px 0 0',
                padding: '32px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                overscrollBehavior: 'contain',
              }}
            >
              {/* Thin violet accent stripe at top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, #7C3AED 0%, #6366F1 100%)' }}
              />

              {/* ── Header ─────────────────────────────────────────── */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl"
                  style={{ background:'rgba(124,58,237,0.12)', border:'1px solid rgba(124,58,237,0.25)', color:'#7C3AED' }}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Authorize Sentinel
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Powered by Prava · Visa Network
                  </p>
                </div>
              </div>

              {/* ── Budget — visual anchor, largest element (spec §4) ─ */}
              <div className="text-center py-6 mb-6 rounded-xl"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                  You are granting Sentinel permission to spend up to
                </p>
                <p className="font-mono font-bold" style={{ fontSize: '40px', lineHeight: 1, color: 'var(--text-primary)' }}>
                  ${mandateRule.maxBudget.toFixed(2)}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  maximum · one-time
                </p>
              </div>

              {/* ── Permission details ──────────────────────────────── */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center py-2"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>For</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {mandateRule.targetItem}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Valid for</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>24 hours</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Sentinel cannot exceed this amount. Ever.</span>
                </div>
              </div>

              {/* ── Passkey state feedback ──────────────────────────── */}
              {passkeyStatus !== 'idle' && (
                <div className="flex flex-col items-center gap-2 py-3 mb-4 rounded-lg text-xs text-center"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  {passkeyStatus === 'creating_mandate' && (
                    <><RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--accent)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Initializing secure mandate with Prava...</p></>
                  )}
                  {passkeyStatus === 'triggering_passkey' && (
                    <>
                      <Lock className="w-4 h-4 animate-bounce" style={{ color: '#7C3AED' }} />
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Awaiting Prava approval...
                      </p>
                      {pravaHostedUrl ? (
                        <div className="w-full rounded-lg border border-violet-500/30 bg-violet-500/10 p-4 space-y-3 text-left">
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            Prava opened in a new tab
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Complete the sandbox card and passkey approval there, then return here. This page will activate the rule automatically.
                          </p>
                          <a
                            href={pravaHostedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-10 w-full items-center justify-center rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-500"
                          >
                            Open Prava approval
                          </a>
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-tertiary)' }}>Preparing sandbox approval...</p>
                      )}
                    </>
                  )}
                  {passkeyStatus === 'verifying' && (
                    <><RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'var(--success)' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Verifying and activating your sentinel...</p></>
                  )}
                  {passkeyStatus === 'success' && (
                    <><CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                    <p className="font-semibold" style={{ color: 'var(--success)' }}>Sentinel is now watching for you!</p></>
                  )}
                  {passkeyStatus === 'error' && (
                    <div className="space-y-2 w-full px-2">
                      <p className="font-semibold" style={{ color: 'var(--danger)' }}>Authentication cancelled. No charge was made.</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{passkeyError}</p>
                      <button
                        onClick={() => runPasskeyFlow(mandateRule)}
                        className="mt-1 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Passkey approve button — Prava brand color ────── */}
              <button
                onClick={() => runPasskeyFlow(mandateRule)}
                disabled={mandateLoading || passkeyStatus === 'success'}
                className="w-full flex items-center justify-center gap-2.5 font-semibold transition-all"
                style={{
                  height: '48px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: mandateLoading || passkeyStatus === 'success'
                    ? 'rgba(124,58,237,0.4)'
                    : 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                  color: '#FFFFFF',
                  cursor: mandateLoading || passkeyStatus === 'success' ? 'not-allowed' : 'pointer',
                  marginBottom: '12px',
                }}
              >
                {mandateLoading
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <Lock className="w-4 h-4" />
                }
                {passkeyStatus === 'success' ? 'Authorized ✓' : 'Approve with Passkey'}
              </button>

              {/* Cancel — ghost, small */}
              <button
                onClick={() => setMandateRule(null)}
                disabled={mandateLoading}
                className="w-full text-center text-xs transition-all py-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Purchase Success Overlay — confetti + checkmark animation */}
      <PurchaseSuccessOverlay
        visible={successOverlay.visible}
        itemName={successOverlay.itemName}
        amount={successOverlay.amount}
        onDone={() => setSuccessOverlay((prev) => ({ ...prev, visible: false }))}
      />

      {/* Footer */}
      <div className="mt-16 border-t border-slate-800/60 pt-6 pb-8">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Visa / Prava badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-blue-500/20 backdrop-blur-sm">
            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            <span className="text-[10px] font-medium text-slate-400 tracking-wide">
              Secured by{" "}
              <span className="text-blue-400 font-semibold">Visa Intelligent Commerce</span>
              {" "}via{" "}
              <span className="text-indigo-400 font-semibold">Prava</span>
            </span>
          </div>

          <span className="text-slate-700 text-xs hidden sm:inline">•</span>

          {/* OpenAI badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/20 backdrop-blur-sm">
            <svg className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" />
              <path d="M7 15v1a5 5 0 0 0 10 0v-1" />
            </svg>
            <span className="text-[10px] font-medium text-slate-400 tracking-wide">
              Intent understood by{" "}
              <span className="text-emerald-400 font-semibold">OpenAI Structured Outputs</span>
            </span>
          </div>

          <span className="text-slate-700 text-xs hidden sm:inline">•</span>

          <span className="text-[10px] text-slate-600 tracking-wide">
            Agentic Commerce Hackathon · Phase 5
          </span>
        </div>
      </div>
    </div>
  );
}

// Inline fallback code icon to avoid complex imports if not standard in lucide
function CodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
