"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Customer, PaginatedData } from "@/src/types/api";
import { getCustomers } from "@/src/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/src/components/ui/table";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Search, Users, ChevronLeft, ChevronRight, AlertCircle, Inbox } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/src/lib/utils";

const statusVariant: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  active: "success", inactive: "secondary", blocked: "warning", deleted: "destructive",
};

export default function CustomersPage() {
  const [data, setData] = useState<PaginatedData<Customer> | Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 15;
  const didInit = useRef(false);

  const load = useCallback(async (p = page, s = search) => {
    setLoading(true); setError(null);
    try { setData(await getCustomers({ page: p, limit, search: s || undefined })); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load customers"); }
    finally { setLoading(false); }
  }, [page, search, limit]);

  useEffect(() => {
    if (!didInit.current) { didInit.current = true; void load(); return; }
    void load();
  }, [load]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setPage(1); void load(1, search); }

  const response = { data };
  const customers: Customer[] = Array.isArray(response?.data)
    ? response.data
    : response?.data?.items ?? [];

  const totalCustomers = (data && !Array.isArray(data) && data.pagination)
    ? data.pagination.total
    : (customers ? customers.length : 0);

  const totalPages = (data && !Array.isArray(data) && data.pagination)
    ? data.pagination.pages
    : 1;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Customers</h1><p className="text-sm text-muted-foreground">Manage your customer database</p></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle><Users className="h-4 w-4 text-sky-400" /></CardHeader><CardContent>{loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{totalCustomers}</div>}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Page</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{page} / {totalPages}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Per Page</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{limit}</div></CardContent></Card>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by name, email or phone…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search customers" /></div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {error && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}<Button size="sm" variant="ghost" className="ml-auto" onClick={() => void load()}>Retry</Button></div>}

      <Card><CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !customers || customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground"><Inbox className="h-10 w-10 mb-3" /><p className="font-medium">No customers found</p><p className="text-sm">Try adjusting your search or seed data in the backend.</p></div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead className="hidden sm:table-cell">Email</TableHead><TableHead className="hidden md:table-cell">Phone</TableHead><TableHead className="hidden lg:table-cell">Status</TableHead><TableHead className="text-right">LTV</TableHead><TableHead className="text-right hidden md:table-cell">Orders</TableHead><TableHead className="hidden lg:table-cell">Last Order</TableHead></TableRow></TableHeader>
            <TableBody>
              {customers && customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell><div className="flex items-center gap-3"><Avatar><AvatarFallback>{getInitials(c.firstName, c.lastName)}</AvatarFallback></Avatar><span className="font-medium">{[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}</span></div></TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{c.email ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{c.phone ?? "—"}</TableCell>
                  <TableCell className="hidden lg:table-cell"><Badge variant={statusVariant[c.status] ?? "secondary"}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(c.lifetimeValue)}</TableCell>
                  <TableCell className="text-right hidden md:table-cell">{c.orderCount}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{formatDate(c.lastOrderAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({totalCustomers} total)</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
