"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth";
import { demoLogin } from "@/src/lib/api";
import { Button } from "@/src/components/ui/button";
import { Users, BarChart3, Zap, BrainCircuit, ArrowRight, Loader2, AlertCircle } from "lucide-react";

const features = [
  { icon: Users, title: "Customer Intelligence", desc: "Unified customer profiles with 360° view" },
  { icon: BarChart3, title: "Campaign Analytics", desc: "Real-time delivery metrics & insights" },
  { icon: Zap, title: "Multi-Channel", desc: "Email, SMS, WhatsApp & RCS campaigns" },
  { icon: BrainCircuit, title: "AI Copilot", desc: "AI-powered segments & message generation" },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const token = await demoLogin();
      login(token);
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-primary/20 via-background to-background p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-white">X</span>
            </div>
            <span className="text-xl font-bold text-foreground">Xeno CRM</span>
          </div>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-foreground">
            AI-Native Customer<br />Intelligence Platform
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            Manage customers, build segments, launch campaigns and track delivery — all powered by AI assistance.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>500+ Customers</span>
            <span className="text-border">•</span>
            <span>3 000+ Orders</span>
            <span className="text-border">•</span>
            <span>AI Assisted</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 Xeno CRM. Assignment submission.</p>
      </div>

      {/* Right panel – login */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-xl font-bold text-white">X</span>
            </div>
            <h2 className="text-xl font-bold">Xeno CRM</h2>
            <p className="text-sm text-muted-foreground">AI-Native Customer Intelligence Platform</p>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your workspace to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button className="w-full h-12 text-base" onClick={handleLogin} disabled={loading} aria-label="Continue with demo account">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ArrowRight className="h-5 w-5" /> Continue with Demo Account</>}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <f.icon className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
