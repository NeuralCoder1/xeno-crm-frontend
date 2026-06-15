"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunicationLog, PaginatedData } from "@/src/types/api";
import { getCommunicationLogs, retryCommunication } from "@/src/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { ScrollText, Search, AlertCircle, Inbox, RotateCcw, Loader2, CheckCircle2 } from "lucide-react";
import { formatDateTime } from "@/src/lib/utils";

const statusVariant: Record<string, "success" | "secondary" | "warning" | "destructive" | "info" | "default"> = {
  queued: "secondary", sent: "info", delivered: "success", opened: "success",
  clicked: "success", bounced: "warning", failed: "destructive",
  unsubscribed: "warning", converted: "default",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retrySuccess, setRetrySuccess] = useState<string | null>(null);
  const didInit = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getCommunicationLogs();
      setLogs(Array.isArray(res) ? res : (res as PaginatedData<CommunicationLog>)?.items ?? []);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!didInit.current) { didInit.current = true; void load(); } }, [load]);

  async function handleRetry(id: string) {
    setRetrying(id); setRetrySuccess(null);
    try { await retryCommunication(id); setRetrySuccess(id); setTimeout(() => setRetrySuccess(null), 3000); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Retry failed"); }
    finally { setRetrying(null); }
  }

  const filtered = search
    ? logs.filter((l) => l.recipient.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase()) || l.status.toLowerCase().includes(search.toLowerCase()))
    : logs;
  const total = logs.length;
  const delivered = logs.filter((l) => ["delivered", "opened", "clicked", "converted"].includes(l.status)).length;
  const failed = logs.filter((l) => l.status === "failed" || l.status === "bounced").length;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Communication Logs</h1><p className="text-sm text-muted-foreground">Track delivery status and retry failed messages</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle><ScrollText className="h-4 w-4 text-pink-400" /></CardHeader><CardContent>{loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{total}</div>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-400">{delivered}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Failed / Bounced</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{failed}</div></CardContent></Card>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by recipient, ID or status…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search communication logs" /></div>

      {error && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}<Button size="sm" variant="ghost" className="ml-auto" onClick={() => void load()}>Retry</Button></div>}
      {retrySuccess && <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" /> Retry scheduled successfully</div>}

      <Card><CardContent className="p-0">
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        : !filtered.length ? <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Inbox className="h-10 w-10 mb-3" /><p className="font-medium">No communication logs</p><p className="text-sm">Logs appear after launching a campaign.</p></div>
        : (
          <Table>
            <TableHeader><TableRow><TableHead>Recipient</TableHead><TableHead className="hidden sm:table-cell">Channel</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Last Event</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell><p className="font-medium truncate max-w-[200px]">{l.recipient}</p><p className="text-xs text-muted-foreground truncate max-w-[200px]">{l.id}</p></TableCell>
                <TableCell className="hidden sm:table-cell"><Badge variant="outline">{l.channel}</Badge></TableCell>
                <TableCell><Badge variant={statusVariant[l.status] ?? "secondary"}>{l.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{formatDateTime(l.lastEventAt)}</TableCell>
                <TableCell className="text-right">{l.status === "failed" && (<Button size="sm" variant="secondary" disabled={retrying === l.id} onClick={() => void handleRetry(l.id)} aria-label={`Retry message ${l.id}`}>{retrying === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Retry</Button>)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
