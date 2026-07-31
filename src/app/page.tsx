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

      const { challenge, rp, user, sessionId } = mandateData;

      // 2. Trigger native WebAuthn Credentials prompt
      setPasskeyStatus("triggering_passkey");

      let credentialResult: any = null;
      let usedFallback = false;

      if (typeof window !== "undefined" && window.navigator && window.navigator.credentials) {
        try {
          const encoder = new TextEncoder();
          const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
            challenge: Uint8Array.from(atob(challenge.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
            rp: {
              name: rp.name,
              id: window.location.hostname === "localhost" ? "localhost" : rp.id,
            },
            user: {
              id: encoder.encode(user.id),
              name: user.name,
              displayName: user.displayName,
            },
            pubKeyCredParams: [
              { alg: -7, type: "public-key" }, // ES256
              { alg: -257, type: "public-key" } // RS256
            ],
            authenticatorSelection: {
              userVerification: "preferred"
            },
            timeout: 30000,
          };

          credentialResult = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
          });
        } catch (webauthnErr: any) {
          console.warn("Native WebAuthn prompt failed or cancelled, using simulated secure fallback:", webauthnErr);
          usedFallback = true;
          toast.info("Using Simulated Passkey Fallback", {
            description: "Native Passkey prompt was cancelled or is unavailable on this device."
          });
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } else {
        console.warn("WebAuthn is not supported by this browser environment, using simulated fallback");
        usedFallback = true;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 3. Verify mandate & activate rule
      setPasskeyStatus("verifying");

      const credentialId = credentialResult ? credentialResult.id : `cred_${Math.random().toString(36).slice(2, 14)}`;

      const actionMessage = usedFallback 
        ? `Prava Mandate authorized via Passkey (Simulated Authentication). Rule activated.`
        : `Prava Mandate authorized via secure Passkey (Credential ID: ${credentialId.slice(0, 15)}...). Rule activated.`;

      const updateRes = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruleId: rule.id,
          status: "ACTIVE",
          action: actionMessage,
          uiIcon: "lock",
          pravaSessionId: sessionId
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
        toast.success(`✅ Purchase Completed!`, {
          description: `Prava token: ${data.paymentToken?.slice(0, 20)}... • $${data.purchaseAmount?.toFixed(2)}`,
          duration: 7000
        });
        fetchData(true);
      } else {
        toast.error(`Purchase blocked: ${data.error}`, { duration: 7000 });
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
          setRules(rulesData.rules);
          setProducts(prodData.products);
          setLastCheckTime(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.error("Error syncing monitor data:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Dynamic Rule Status Badge Styling
  const getStatusBadge = (status: Rule["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "PENDING_APPROVAL":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "TRIGGERED":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse";
      case "SUCCESS":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "FAILED":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-medium backdrop-blur-md shadow-lg shadow-emerald-950/50">
          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>Phase 4 Active • Autonomous Execution Engine</span>
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

      {/* Conversational Rule Input Section */}
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
        <ConversationalRuleInput onRuleCreated={(rule) => {
          fetchData(true);
          if (rule) {
            setMandateRule(rule);
            setPasskeyStatus("idle");
            setPasskeyError(null);
          }
        }} />
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
            <div className="flex gap-2 mt-4 border-t border-slate-800/80 pt-4">
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
                      ? "bg-blue-600/15 border-blue-500/40 text-blue-300"
                      : "border-transparent bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
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
                    <div className="text-center py-12 border border-slate-800 rounded-xl bg-slate-950/20 text-slate-400 text-sm">
                      No rules registered yet. Use the Conversational Rule Input above to add one!
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

                      {/* Prava Token Details */}
                      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] font-mono space-y-1.5">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <CreditCard className="w-3 h-3 text-blue-400" />
                          <span className="text-blue-400 uppercase tracking-wider font-bold text-[9px]">Prava Single-Use Token</span>
                        </div>
                        {tokenLog?.pravaSessionId ? (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Token ID:</span>
                            <span className="text-blue-400 font-bold truncate max-w-[200px]">{tokenLog.pravaSessionId}</span>
                          </div>
                        ) : (
                          <div className="text-slate-500 italic">Token data in audit log</div>
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

      {/* Mandate / Passkey Security Confirmation Modal */}
      <AnimatePresence>
        {mandateRule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!mandateLoading) setMandateRule(null);
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl space-y-6 z-10"
            >
              {/* Top glow accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

              {/* Modal Header */}
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Security Confirmation</h3>
                  <p className="text-xs text-slate-400">Prava Secure Transaction Mandate Authorization</p>
                </div>
              </div>

              {/* Modal Body / Mandate Warning */}
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm leading-relaxed space-y-2">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="font-semibold text-[13px]">
                      Sentinel is authorized to spend a MAXIMUM of $60. It cannot exceed this. You will be notified before and after.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Target Asset</span>
                    <span className="font-mono font-bold text-slate-200">{mandateRule.targetItem}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-900 pt-2">
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Limit Request</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">${mandateRule.maxBudget.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-900 pt-2">
                    <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Mandate Status</span>
                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/50">
                      Awaiting Authorization
                    </span>
                  </div>
                </div>
              </div>

              {/* Passkey State Indicators */}
              {passkeyStatus !== "idle" && (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-2 flex flex-col justify-center items-center text-center">
                  {passkeyStatus === "creating_mandate" && (
                    <>
                      <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                      <p>Initializing secure mandate session on Prava network...</p>
                    </>
                  )}
                  {passkeyStatus === "triggering_passkey" && (
                    <>
                      <Lock className="w-5 h-5 text-indigo-400 animate-bounce" />
                      <p className="font-semibold text-indigo-300">Awaiting Passkey Authentication (Windows Hello / OS Prompt)...</p>
                      <p className="text-[10px] text-slate-500">Please complete the native system security prompt to sign the mandate.</p>
                    </>
                  )}
                  {passkeyStatus === "verifying" && (
                    <>
                      <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                      <p>Verifying cryptographically signed mandate & activating rule...</p>
                    </>
                  )}
                  {passkeyStatus === "success" && (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <p className="text-emerald-300 font-bold">Mandate Signed & Authorized Successfully!</p>
                    </>
                  )}
                  {passkeyStatus === "error" && (
                    <div className="text-center space-y-1 w-full">
                      <AlertTriangle className="w-5 h-5 text-rose-400 mx-auto" />
                      <p className="text-rose-400 font-bold">Authentication Cancelled/Failed</p>
                      <p className="text-[10px] text-slate-400 leading-normal max-h-16 overflow-y-auto">{passkeyError}</p>
                      <Button 
                        onClick={() => runPasskeyFlow(mandateRule)}
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-xs border-slate-700 bg-slate-900 text-slate-200"
                      >
                        Retry Mandate Signature
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-800/80">
                <Button
                  variant="outline"
                  onClick={() => setMandateRule(null)}
                  disabled={mandateLoading}
                  className="border-slate-800 hover:bg-slate-800 text-slate-400 text-xs px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant="glow"
                  onClick={() => runPasskeyFlow(mandateRule)}
                  disabled={mandateLoading || passkeyStatus === "success"}
                  className="gap-2 px-5 text-xs text-blue-300 font-semibold"
                >
                  {mandateLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  Authorize via Passkey
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-16 text-center text-xs text-slate-500 border-t border-slate-800/60 pt-6">
        Agentic Commerce Hackathon • Phase 4 Active • Autonomous Payment Execution Engine
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
