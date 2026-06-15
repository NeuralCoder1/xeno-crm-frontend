"use client";

import { useState } from "react";
import type { AudienceRuleGroup, AudienceRuleCondition } from "@/src/types/api";
import { aiGenerateSegment, aiGenerateMessage, aiRecommendChannel } from "@/src/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import { BrainCircuit, Layers, MessageSquare, Radio, Loader2, Copy, RotateCcw, Trash2, ChevronDown, ChevronRight, AlertCircle, Check } from "lucide-react";

function RuleChips({ rules }: { rules: AudienceRuleGroup }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {rules.conditions.map((c, i) => {
        if ("field" in c) {
          const cond = c as AudienceRuleCondition;
          return (
            <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary font-medium">
              {cond.field.replace("customer.", "").replace("attributes.", "")} <span className="text-muted-foreground">{cond.operator}</span> {String(cond.value ?? "")}
            </span>
          );
        }
        return <span key={i} className="text-xs text-muted-foreground">({(c as AudienceRuleGroup).operator} group)</span>;
      })}
    </div>
  );
}

export default function AICopilotPage() {
  /* Segment */
  const [segPrompt, setSegPrompt] = useState("");
  const [segRules, setSegRules] = useState<AudienceRuleGroup | null>(null);
  const [segLoading, setSegLoading] = useState(false);
  const [segJson, setSegJson] = useState(false);
  const [segErr, setSegErr] = useState<string | null>(null);

  /* Message */
  const [msgType, setMsgType] = useState("promotional");
  const [msgObj, setMsgObj] = useState("");
  const [msgResult, setMsgResult] = useState<{ subject: string; body: string } | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgJson, setMsgJson] = useState(false);
  const [msgErr, setMsgErr] = useState<string | null>(null);

  /* Channel */
  const [chType, setChType] = useState("promotional");
  const [chSize, setChSize] = useState("500");
  const [chResult, setChResult] = useState<{ channel: string; reason: string } | null>(null);
  const [chLoading, setChLoading] = useState(false);
  const [chJson, setChJson] = useState(false);
  const [chErr, setChErr] = useState<string | null>(null);

  const [copied, setCopied] = useState<string | null>(null);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
  }

  async function genSegment() {
    if (!segPrompt.trim()) return;
    setSegLoading(true); setSegErr(null);
    try { const r = await aiGenerateSegment(segPrompt); setSegRules(r.rules); }
    catch (e) { setSegErr(e instanceof Error ? e.message : "Failed"); }
    finally { setSegLoading(false); }
  }

  async function genMessage() {
    if (!msgObj.trim()) return;
    setMsgLoading(true); setMsgErr(null);
    try { const r = await aiGenerateMessage(msgType, msgObj); setMsgResult(r.message); }
    catch (e) { setMsgErr(e instanceof Error ? e.message : "Failed"); }
    finally { setMsgLoading(false); }
  }

  async function genChannel() {
    setChLoading(true); setChErr(null);
    try { const r = await aiRecommendChannel(chType, parseInt(chSize) || 500); setChResult(r); }
    catch (e) { setChErr(e instanceof Error ? e.message : "Failed"); }
    finally { setChLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">AI Copilot</h1><p className="text-sm text-muted-foreground">Generate segments, messages and channel recommendations with AI</p></div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Segment card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-2">
            <Layers className="h-5 w-5 text-amber-400" /><CardTitle>Audience Segment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Describe your audience</Label><Textarea placeholder="e.g. High value customers in Mumbai with email consent" value={segPrompt} onChange={(e) => setSegPrompt(e.target.value)} rows={3} /></div>
            <div className="flex gap-2">
              <Button onClick={genSegment} disabled={segLoading || !segPrompt.trim()} className="flex-1">{segLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />} Generate</Button>
              {segRules && <Button variant="ghost" size="icon" onClick={() => { setSegRules(null); setSegPrompt(""); }} aria-label="Clear"><Trash2 className="h-4 w-4" /></Button>}
            </div>
            {segErr && <div className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{segErr}</div>}
            {segRules && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <p className="text-xs font-medium text-muted-foreground">Generated Rules</p>
                <RuleChips rules={segRules} />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyText(JSON.stringify(segRules, null, 2), "seg")}>{copied === "seg" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy</Button>
                  <Button size="sm" variant="ghost" onClick={genSegment} disabled={segLoading}><RotateCcw className="h-3 w-3" /> Redo</Button>
                </div>
                <button onClick={() => setSegJson(!segJson)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  {segJson ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} Developer View
                </button>
                {segJson && <pre className="overflow-auto rounded bg-background p-3 text-xs text-muted-foreground max-h-48">{JSON.stringify(segRules, null, 2)}</pre>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-2">
            <MessageSquare className="h-5 w-5 text-sky-400" /><CardTitle>Message Copy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Campaign type</Label><Input value={msgType} onChange={(e) => setMsgType(e.target.value)} placeholder="promotional" /></div>
            <div className="space-y-2"><Label>Objective</Label><Textarea placeholder="e.g. Announce monsoon sale with 20% off" value={msgObj} onChange={(e) => setMsgObj(e.target.value)} rows={2} /></div>
            <div className="flex gap-2">
              <Button onClick={genMessage} disabled={msgLoading || !msgObj.trim()} className="flex-1">{msgLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />} Generate</Button>
              {msgResult && <Button variant="ghost" size="icon" onClick={() => { setMsgResult(null); setMsgObj(""); }} aria-label="Clear"><Trash2 className="h-4 w-4" /></Button>}
            </div>
            {msgErr && <div className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{msgErr}</div>}
            {msgResult && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div><p className="text-xs font-medium text-muted-foreground">Subject</p><p className="text-sm font-semibold mt-1">{msgResult.subject}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground">Body</p><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{msgResult.body}</p></div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyText(`${msgResult.subject}\n\n${msgResult.body}`, "msg")}>{copied === "msg" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy</Button>
                  <Button size="sm" variant="ghost" onClick={genMessage} disabled={msgLoading}><RotateCcw className="h-3 w-3" /> Redo</Button>
                </div>
                <button onClick={() => setMsgJson(!msgJson)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  {msgJson ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} Developer View
                </button>
                {msgJson && <pre className="overflow-auto rounded bg-background p-3 text-xs text-muted-foreground max-h-48">{JSON.stringify(msgResult, null, 2)}</pre>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel card */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center gap-2">
            <Radio className="h-5 w-5 text-emerald-400" /><CardTitle>Channel Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Campaign type</Label><Input value={chType} onChange={(e) => setChType(e.target.value)} placeholder="promotional" /></div>
            <div className="space-y-2"><Label>Audience size</Label><Input type="number" value={chSize} onChange={(e) => setChSize(e.target.value)} placeholder="500" /></div>
            <div className="flex gap-2">
              <Button onClick={genChannel} disabled={chLoading} className="flex-1">{chLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />} Recommend</Button>
              {chResult && <Button variant="ghost" size="icon" onClick={() => setChResult(null)} aria-label="Clear"><Trash2 className="h-4 w-4" /></Button>}
            </div>
            {chErr && <div className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{chErr}</div>}
            {chResult && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2"><Badge variant="default" className="text-sm px-3 py-1">{chResult.channel.toUpperCase()}</Badge></div>
                <p className="text-sm text-muted-foreground">{chResult.reason}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyText(chResult.channel, "ch")}>{copied === "ch" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} Copy</Button>
                  <Button size="sm" variant="ghost" onClick={genChannel} disabled={chLoading}><RotateCcw className="h-3 w-3" /> Redo</Button>
                </div>
                <button onClick={() => setChJson(!chJson)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                  {chJson ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} Developer View
                </button>
                {chJson && <pre className="overflow-auto rounded bg-background p-3 text-xs text-muted-foreground max-h-48">{JSON.stringify(chResult, null, 2)}</pre>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
