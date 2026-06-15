"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import type { DashboardSummary } from "@/src/types/api";
import { getDashboard } from "@/src/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Users, Layers, Megaphone, ScrollText, Plus, ArrowRight, RefreshCcw, AlertCircle, ShoppingCart } from "lucide-react";
import { formatNumber } from "@/src/lib/utils";

const kpiConfig = [
  { key: "customers" as const, label: "Customers", icon: Users, color: "text-sky-400" },
  { key: "orders" as const, label: "Orders", icon: ShoppingCart, color: "text-emerald-400" },
  { key: "segments" as const, label: "Segments", icon: Layers, color: "text-amber-400" },
  { key: "campaigns" as const, label: "Campaigns", icon: Megaphone, color: "text-violet-400" },
  { key: "communicationLogs" as const, label: "Comm Logs", icon: ScrollText, color: "text-pink-400" },
];

const quickActions = [
  { href: "/customers", label: "View Customers", icon: Users },
  { href: "/segments", label: "Create Segment", icon: Layers },
  { href: "/campaigns", label: "New Campaign", icon: Megaphone },
  { href: "/ai", label: "AI Copilot", icon: Plus },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const didInit = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard();
      setData(res);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome to Xeno CRM overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} aria-label="Refresh dashboard">
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => void load()}>Retry</Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiConfig.map((kpi) => (
          <Card key={kpi.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>{loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{data ? formatNumber(data[kpi.key]) : "—"}</div>}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a) => (
              <Link key={a.href} href={a.href}>
                <div className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary cursor-pointer">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><a.icon className="h-4 w-4" /></div>
                  <span className="text-sm font-medium">{a.label}</span>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {lastUpdated && <p className="text-xs text-muted-foreground text-right">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
    </div>
  );
}
