"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Campaign, Segment, PaginatedData, CampaignType, Channel } from "@/src/types/api";
import { getCampaigns, getSegments, createCampaign, launchCampaign, aiGenerateMessage } from "@/src/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Megaphone, Plus, Loader2, AlertCircle, Inbox, BrainCircuit, Rocket, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, capitalize } from "@/src/lib/utils";

const statusVariant: Record<string, "success" | "secondary" | "warning" | "destructive" | "info" | "default"> = {
  draft: "secondary", scheduled: "info", running: "default", paused: "warning", completed: "success", cancelled: "secondary", failed: "destructive",
};
const campaignTypes: CampaignType[] = ["promotional", "transactional", "winback", "announcement"];
const channels: Channel[] = ["email", "sms", "whatsapp", "rcs"];

export default function CampaignsPage() {
  const [data, setData] = useState<PaginatedData<Campaign> | Campaign[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const didInit = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await getCampaigns({ page, limit: 15 })); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
    }
    Promise.resolve().then(() => { void load(); });
  }, [load]);

  async function handleLaunch(id: string) {
    setLaunching(id);
    try { await launchCampaign(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Launch failed"); }
    finally { setLaunching(null); }
  }

  const items = Array.isArray(data)
    ? data
    : data?.items ?? [];
  const totalPages = (data && !Array.isArray(data) && data.pagination)
    ? data.pagination.pages
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Campaigns</h1><p className="text-sm text-muted-foreground">Create and manage marketing campaigns</p></div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> New Campaign</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {["draft", "running", "completed", "failed"].map((st) => (
          <Card key={st}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{capitalize(st)}</CardTitle><Megaphone className="h-4 w-4 text-violet-400" /></CardHeader>
            <CardContent>{loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{items.filter((c) => c.status === st).length}</div>}</CardContent></Card>
        ))}
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}<Button size="sm" variant="ghost" className="ml-auto" onClick={() => void load()}>Retry</Button></div>}

      <Card><CardContent className="p-0">
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        : !items.length ? <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Inbox className="h-10 w-10 mb-3" /><p className="font-medium">No campaigns yet</p><p className="text-sm">Create your first campaign.</p></div>
        : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Channel</TableHead><TableHead className="hidden md:table-cell">Type</TableHead><TableHead>Status</TableHead><TableHead className="hidden lg:table-cell">Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{items.map((c) => (
              <TableRow key={c.id}>
                <TableCell><p className="font-medium">{c.name}</p></TableCell>
                <TableCell className="hidden sm:table-cell"><Badge variant="outline">{c.channel}</Badge></TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{c.type}</TableCell>
                <TableCell><Badge variant={statusVariant[c.status] ?? "secondary"}>{c.status}</Badge></TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                <TableCell className="text-right">{c.status === "draft" && (<Button size="sm" variant="secondary" disabled={launching === c.id} onClick={() => void handleLaunch(c.id)}>{launching === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />} Launch</Button>)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>

      {totalPages > 1 && <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button></div>}

      <CreateCampaignModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); void load(); }} />
    </div>
  );
}

function CreateCampaignModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [name, setName] = useState(""); const [type, setType] = useState<CampaignType>("promotional"); const [channel, setChannel] = useState<Channel>("email");
  const [segmentId, setSegmentId] = useState(""); const [subject, setSubject] = useState(""); const [body, setBody] = useState("");
  const [aiObjective, setAiObjective] = useState(""); const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false); const [err, setErr] = useState<string | null>(null);
  const didLoad = useRef(false);

  useEffect(() => {
    if (open && !didLoad.current) {
      didLoad.current = true;
      void getSegments()
        .then((res) => {
          setSegments(Array.isArray(res) ? res : (res as PaginatedData<Segment>)?.items ?? []);
        })
        .catch(() => {});
    }
    if (!open) didLoad.current = false;
  }, [open]);

  function reset() { setName(""); setType("promotional"); setChannel("email"); setSegmentId(""); setSubject(""); setBody(""); setAiObjective(""); setErr(null); }

  async function handleAi() { if (!aiObjective.trim()) return; setAiLoading(true); setErr(null); try { const res = await aiGenerateMessage(type, aiObjective); setSubject(res.message.subject); setBody(res.message.body); } catch (e) { setErr(e instanceof Error ? e.message : "AI failed"); } finally { setAiLoading(false); } }

  async function handleCreate() { setSaving(true); setErr(null); try { await createCampaign({ name, type, channel, segmentId, content: { subject, body } }); reset(); onCreated(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed to create"); } finally { setSaving(false); } }

  const valid = name.trim() && segmentId && body.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" aria-describedby="create-campaign-desc">
        <DialogHeader><DialogTitle>Create Campaign</DialogTitle><DialogDescription id="create-campaign-desc">Set up and launch a new campaign.</DialogDescription></DialogHeader>
        {err && <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{err}</div>}
        <div className="space-y-4 py-2">
          <div className="space-y-2"><Label htmlFor="c-name">Campaign Name</Label><Input id="c-name" placeholder="e.g. Monsoon Sale" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="c-type">Type</Label><select id="c-type" value={type} onChange={(e) => setType(e.target.value as CampaignType)} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">{campaignTypes.map((t) => <option key={t} value={t}>{capitalize(t)}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="c-channel">Channel</Label><select id="c-channel" value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">{channels.map((ch) => <option key={ch} value={ch}>{ch.toUpperCase()}</option>)}</select></div>
          </div>
          <div className="space-y-2"><Label htmlFor="c-segment">Segment</Label><select id="c-segment" value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"><option value="">Select a segment…</option>{segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="space-y-2"><Label>AI Message Generator</Label><div className="flex gap-2"><Input placeholder="Campaign objective…" value={aiObjective} onChange={(e) => setAiObjective(e.target.value)} /><Button variant="secondary" onClick={() => void handleAi()} disabled={aiLoading}>{aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}</Button></div></div>
          {channel === "email" && <div className="space-y-2"><Label htmlFor="c-subject">Subject</Label><Input id="c-subject" placeholder="Email subject line" value={subject} onChange={(e) => setSubject(e.target.value)} /><p className="text-xs text-muted-foreground text-right">{subject.length} chars</p></div>}
          <div className="space-y-2"><Label htmlFor="c-body">Message Body</Label><Textarea id="c-body" placeholder="Write your message…" value={body} onChange={(e) => setBody(e.target.value)} rows={4} /><p className="text-xs text-muted-foreground text-right">{body.length} chars</p></div>
          {body && <div className="rounded-lg border border-border p-4 space-y-1"><p className="text-xs font-medium text-muted-foreground">Preview</p>{subject && <p className="text-sm font-semibold">{subject}</p>}<p className="text-sm text-muted-foreground whitespace-pre-wrap">{body}</p></div>}
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button><Button disabled={!valid || saving} onClick={() => void handleCreate()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
