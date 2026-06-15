"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Segment, AudienceRuleGroup, AudienceRuleCondition, PaginatedData } from "@/src/types/api";
import { getSegments, createSegment, aiGenerateSegment } from "@/src/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/src/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Layers, Plus, BrainCircuit, Loader2, AlertCircle, Inbox, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { formatDate } from "@/src/lib/utils";

const statusVariant: Record<string, "success" | "secondary" | "warning"> = { active: "success", draft: "secondary", archived: "warning" };

function RuleChips({ rules }: { rules: AudienceRuleGroup }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {rules.conditions.map((c, i) => {
        if ("field" in c) { const cond = c as AudienceRuleCondition; return (<span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary font-medium">{cond.field.replace("customer.", "").replace("attributes.", "")} <span className="text-muted-foreground">{cond.operator}</span> {String(cond.value ?? "")}</span>); }
        return <span key={i} className="text-xs text-muted-foreground">({(c as AudienceRuleGroup).operator} group)</span>;
      })}
    </div>
  );
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const didInit = useRef(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await getSegments();
      setSegments(Array.isArray(res) ? res : (res as PaginatedData<Segment>)?.items ?? []);
    }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!didInit.current) { didInit.current = true; void load(); } }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Segments</h1><p className="text-sm text-muted-foreground">Build and manage audience segments</p></div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Create Segment</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle><Layers className="h-4 w-4 text-amber-400" /></CardHeader><CardContent>{loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{segments.length}</div>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{segments.filter((s) => s.status === "active").length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Draft</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{segments.filter((s) => s.status === "draft").length}</div></CardContent></Card>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}<Button size="sm" variant="ghost" className="ml-auto" onClick={() => void load()}>Retry</Button></div>}

      <Card><CardContent className="p-0">
        {loading ? <div className="space-y-3 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        : !segments.length ? <div className="flex flex-col items-center justify-center py-16 text-muted-foreground"><Inbox className="h-10 w-10 mb-3" /><p className="font-medium">No segments yet</p><p className="text-sm">Create your first audience segment.</p></div>
        : (
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Status</TableHead><TableHead className="hidden md:table-cell">Rules</TableHead><TableHead className="text-right hidden lg:table-cell">Audience</TableHead><TableHead className="hidden lg:table-cell">Updated</TableHead></TableRow></TableHeader>
            <TableBody>{segments.map((s) => (
              <TableRow key={s.id}>
                <TableCell><div><p className="font-medium">{s.name}</p>{s.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{s.description}</p>}</div></TableCell>
                <TableCell className="hidden sm:table-cell"><Badge variant={statusVariant[s.status] ?? "secondary"}>{s.status}</Badge></TableCell>
                <TableCell className="hidden md:table-cell"><RuleChips rules={s.rules} /></TableCell>
                <TableCell className="text-right hidden lg:table-cell">{s.estimatedAudienceSize ?? "—"}</TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(s.updatedAt)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        )}
      </CardContent></Card>

      <CreateSegmentModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={() => { setModalOpen(false); void load(); }} />
    </div>
  );
}

function CreateSegmentModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState<AudienceRuleGroup>({ operator: "and", conditions: [{ field: "customer.status", operator: "eq", value: "active" }] });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function reset() { setStep(1); setName(""); setDescription(""); setRules({ operator: "and", conditions: [{ field: "customer.status", operator: "eq", value: "active" }] }); setAiPrompt(""); setErr(null); }

  async function handleAi() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setErr(null);
    try { const res = await aiGenerateSegment(aiPrompt); setRules(res.rules); }
    catch (e) { setErr(e instanceof Error ? e.message : "AI generation failed"); }
    finally { setAiLoading(false); }
  }

  async function handleCreate() {
    setSaving(true); setErr(null);
    try { await createSegment({ name, description: description || undefined, status: "active", rules }); reset(); onCreated(); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed to create segment"); }
    finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent className="max-w-xl" aria-describedby="create-segment-desc">
        <DialogHeader><DialogTitle>Create Segment — Step {step} of 3</DialogTitle><DialogDescription id="create-segment-desc">{step === 1 && "Enter segment details"}{step === 2 && "Define audience rules or use AI"}{step === 3 && "Review and create"}</DialogDescription></DialogHeader>
        {err && <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{err}</div>}
        {step === 1 && (<div className="space-y-4 py-2"><div className="space-y-2"><Label htmlFor="seg-name">Name</Label><Input id="seg-name" placeholder="e.g. High-value Mumbai customers" value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="seg-desc">Description (optional)</Label><Textarea id="seg-desc" placeholder="Describe this segment…" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div><div className="flex justify-end"><Button disabled={!name.trim()} onClick={() => setStep(2)}>Next <ArrowRight className="h-4 w-4" /></Button></div></div>)}
        {step === 2 && (<div className="space-y-4 py-2"><div className="space-y-2"><Label>AI Assist — describe your audience</Label><div className="flex gap-2"><Input placeholder="e.g. High value customers in Mumbai" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} /><Button variant="secondary" onClick={() => void handleAi()} disabled={aiLoading || !aiPrompt.trim()}>{aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />} Generate</Button></div></div><div className="space-y-2"><Label>Current Rules</Label><RuleChips rules={rules} /></div><div className="flex justify-between"><Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4" /> Back</Button><Button onClick={() => setStep(3)}>Review <ArrowRight className="h-4 w-4" /></Button></div></div>)}
        {step === 3 && (<div className="space-y-4 py-2"><div className="rounded-lg border border-border p-4 space-y-3"><div><span className="text-xs text-muted-foreground">Name</span><p className="font-medium">{name}</p></div>{description && <div><span className="text-xs text-muted-foreground">Description</span><p className="text-sm text-muted-foreground">{description}</p></div>}<div><span className="text-xs text-muted-foreground">Rules</span><div className="mt-1"><RuleChips rules={rules} /></div></div></div><div className="flex justify-between"><Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4" /> Back</Button><Button onClick={() => void handleCreate()} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Create Segment</Button></div></div>)}
      </DialogContent>
    </Dialog>
  );
}
