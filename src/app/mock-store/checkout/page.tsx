"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const priceParam = searchParams.get("price") || "0.00";
  const price = parseFloat(priceParam);

  const [productName, setProductName] = useState<string>("Mock Product");
  const [productCategory, setProductCategory] = useState<string>("General");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");

  // Fetch product info from local catalog to display correct details
  useEffect(() => {
    if (!productId) return;
    fetch("/api/mock-store/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          const matched = data.products.find((p: any) => p.id === productId);
          if (matched) {
            setProductName(matched.name);
            setProductCategory(matched.category);
          }
        }
      })
      .catch((err) => console.error("Error fetching product metadata:", err));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await fetch("/api/mock-store/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          price,
          cardNumber,
          expiry,
          cvv,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        const receiptId = `rcpt_${Math.random().toString(36).slice(2, 10)}`;
        setReceiptUrl(`https://prava.pay/receipts/${receiptId}`);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Checkout failed. Please check card credentials.");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[200px] bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-lg space-y-6">
        {/* Merchant Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-950/40 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Storefront Mock checkout portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Complete Your Order</h1>
          <p className="text-slate-400 text-sm">Review your item and enter card credentials below to pay</p>
        </div>

        {status === "success" ? (
          /* SUCCESS STATE PANEL */
          <Card className="border-emerald-500/20 bg-slate-900/60 backdrop-blur-xl shadow-2xl p-8 text-center space-y-6">
            <div className="mx-auto p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit text-emerald-400">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-100">Payment Processed!</CardTitle>
              <CardDescription className="text-slate-400 text-sm leading-normal">
                Your card has been charged successfully. An autonomous receipt is available below.
              </CardDescription>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-left text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="text-slate-300 font-bold">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Charged Amount:</span>
                <span className="text-emerald-400 font-bold">${price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="text-slate-300">Prava Single-use Card</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Button asChild variant="glow" className="w-full">
                <a id="receipt-link" href={receiptUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                  View Verified Receipt <ArrowRight className="w-4 h-4" />
                </a>
              </Button>
              <p className="text-[10px] text-slate-500 italic">Playwright fallback handler: extract link from #receipt-link</p>
            </div>
          </Card>
        ) : (
          /* FORM STATE PANEL */
          <form onSubmit={handleSubmit}>
            <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Order Summary Item details */}
              <div className="p-5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-900/50">
                    {productCategory}
                  </span>
                  <h4 className="font-bold text-sm text-slate-200 line-clamp-1">{productName}</h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">Total Due</span>
                  <span className="font-mono text-lg font-bold text-slate-100">${price.toFixed(2)}</span>
                </div>
              </div>

              <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  Credit / Debit Card Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Fill in the temporary card credentials generated by your Prava account.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {status === "error" && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Card Number Input */}
                <div className="space-y-1.5">
                  <label htmlFor="card-number" className="text-xs font-semibold text-slate-300 block">
                    Card Number
                  </label>
                  <div className="relative">
                    <Input
                      id="card-number"
                      placeholder="4111 1111 1111 1111"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="pl-10 font-mono tracking-widest text-slate-200"
                    />
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Expiry & CVV Inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="expiry" className="text-xs font-semibold text-slate-300 block">
                      Expiration Date (MM/YY)
                    </label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="font-mono text-center text-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="cvv" className="text-xs font-semibold text-slate-300 block">
                      Security Code (CVV)
                    </label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      required
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="font-mono text-center text-slate-200"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex flex-col gap-4 border-t border-slate-800/80 bg-slate-950/20">
                <Button
                  id="pay-button"
                  type="submit"
                  variant="glow"
                  disabled={isSubmitting}
                  className="w-full h-11 text-sm font-bold uppercase tracking-wider gap-2 mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ${price.toFixed(2)}</span>
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </Button>

                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 select-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500/70" />
                    <span>
                      Secured by{" "}
                      <span className="text-blue-400 font-semibold">Visa Intelligent Commerce</span>
                      {" "}via{" "}
                      <span className="text-indigo-400 font-semibold">Prava</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600 select-none">
                    <svg className="w-3 h-3 text-emerald-500/60 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" />
                      <path d="M7 15v1a5 5 0 0 0 10 0v-1" />
                    </svg>
                    <span>Intent parsed by <span className="text-emerald-500/80 font-semibold">OpenAI Structured Outputs</span></span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
