"use client";

import { useMemo, useState } from "react";
import { Download, FileDown, Printer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useGetLocalSettingsQuery, useListCashSessionsQuery, useListDebtsQuery, useListSalesQuery, useListStaffQuery } from "@/lib/services/mezani-api";
import { currency, titleCase } from "@/lib/utils";
import { ClientChart } from "@/components/charts/client-chart";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

function localDate() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export default function ReportsPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const [date, setDate] = useState(localDate());
  const salesQuery = useListSalesQuery(restaurantId, { skip: !restaurantId });
  const cashQuery = useListCashSessionsQuery(restaurantId, { skip: !restaurantId });
  const debtsQuery = useListDebtsQuery(restaurantId, { skip: !restaurantId });
  const staffQuery = useListStaffQuery(restaurantId, { skip: !restaurantId });
  const settingsQuery = useGetLocalSettingsQuery(restaurantId, { skip: !restaurantId });
  const sales = useMemo(() => (salesQuery.data?.sales ?? []).filter((sale) => sale.created_at.slice(0, 10) === date), [date, salesQuery.data?.sales]);
  const staffNames = useMemo(() => new Map((staffQuery.data?.staff ?? []).map((staff) => [staff.id, `${staff.first_name} ${staff.last_name}`])), [staffQuery.data?.staff]);
  const totals = useMemo(() => sales.reduce((sum, sale) => ({ cdf: sum.cdf + (sale.total_currency === "CDF" ? sale.total_amount : 0), usd: sum.usd + (sale.total_currency === "USD" ? sale.total_amount : 0), creditCdf: sum.creditCdf + (sale.total_currency === "CDF" ? sale.credit_amount : 0), creditUsd: sum.creditUsd + (sale.total_currency === "USD" ? sale.credit_amount : 0) }), { cdf: 0, usd: 0, creditCdf: 0, creditUsd: 0 }), [sales]);
  const hourly = useMemo(() => Array.from({ length: 24 }, (_, hour) => { const hourSales = sales.filter((sale) => new Date(sale.created_at).getHours() === hour); return { hour: `${String(hour).padStart(2, "0")}h`, cdf: hourSales.reduce((sum, sale) => sum + (sale.total_currency === "CDF" ? sale.total_amount : sale.total_amount * (sale.cdf_per_usd || settingsQuery.data?.cdf_per_usd || 2800)), 0) }; }).filter((entry) => entry.cdf > 0), [sales, settingsQuery.data?.cdf_per_usd]);
  const methodTotals = useMemo(() => { const result = new Map<string, number>(); sales.flatMap((sale) => sale.tenders).forEach((tender) => result.set(tender.method, (result.get(tender.method) ?? 0) + 1)); return Array.from(result.entries()).sort((a, b) => b[1] - a[1]); }, [sales]);
  const hasError = salesQuery.isError || cashQuery.isError || debtsQuery.isError;

  function exportCSV() {
    const rows = [["vente", "commande", "date", "montant", "devise", "statut", "caissier"], ...sales.map((sale) => [sale.id, sale.order_id, sale.created_at, sale.total_amount, sale.total_currency, sale.payment_status, staffNames.get(sale.created_by) ?? sale.created_by])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `mezani-rapport-${date}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeading eyebrow="Controle" title="Rapport journalier" action={<><Button onClick={exportCSV} disabled={sales.length === 0}><FileDown className="h-4 w-4" />CSV</Button><Button variant="primary" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimer / PDF</Button></>}>
        Rapport construit uniquement avec les ventes, caisses et ardoises enregistrees dans l'API.
      </PageHeading>
      <Panel className="mb-5"><div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end"><label className="grid gap-1.5 text-xs font-semibold uppercase text-text-secondary"><span>Journee</span><Field type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><div className="text-sm text-text-secondary">Fuseau : Africa/Kinshasa · Taux courant : 1 USD = {currency(settingsQuery.data?.cdf_per_usd ?? 2800, "CDF")}</div></div></Panel>
      {hasError ? <ErrorState detail="Certaines donnees du rapport ne sont pas accessibles pour ce role." /> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Ventes CDF" value={currency(totals.cdf, "CDF")} />
        <Metric label="Ventes USD" value={currency(totals.usd, "USD")} />
        <Metric label="Commandes encaissees" value={String(sales.length)} />
        <Metric label="Credit accorde" value={`${currency(totals.creditCdf, "CDF")} · ${currency(totals.creditUsd, "USD")}`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel><PanelHeader title="Ventes par heure" eyebrow="Equivalent CDF" />{hourly.length === 0 ? <EmptyState title="Aucune vente pour cette date" /> : <div className="h-[320px] p-4"><ClientChart><ResponsiveContainer width="100%" height="100%"><BarChart data={hourly}><CartesianGrid stroke="#E2E8F0" vertical={false} /><XAxis dataKey="hour" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} /><Tooltip formatter={(value) => currency(Number(value), "CDF")} /><Bar dataKey="cdf" fill="#10B981" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></ClientChart></div>}</Panel>
        <Panel><PanelHeader title="Moyens de paiement" />{methodTotals.length === 0 ? <EmptyState title="Aucun paiement" /> : <div className="divide-y divide-border">{methodTotals.map(([method, count]) => <div key={method} className="flex items-center justify-between px-4 py-4"><span className="text-sm font-medium text-primary">{titleCase(method)}</span><StatusPill tone="info">{count} operations</StatusPill></div>)}</div>}</Panel>
      </div>

      <Panel className="mt-5"><PanelHeader title="Detail des encaissements" eyebrow={`${sales.length} lignes`} /><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead><tr className="border-b border-border bg-surface-elevated text-xs uppercase text-text-secondary"><th className="px-4 py-3">Heure</th><th className="px-4 py-3">Commande</th><th className="px-4 py-3">Caissier</th><th className="px-4 py-3">Paiements</th><th className="px-4 py-3">Credit</th><th className="px-4 py-3">Total</th></tr></thead><tbody className="divide-y divide-border">{sales.map((sale) => <tr key={sale.id}><td className="px-4 py-4 text-sm text-text-secondary">{new Date(sale.created_at).toLocaleTimeString("fr-CD", { hour: "2-digit", minute: "2-digit" })}</td><td className="px-4 py-4 font-medium text-primary">{sale.order_id || sale.id}</td><td className="px-4 py-4 text-sm text-text-secondary">{staffNames.get(sale.created_by) ?? sale.created_by}</td><td className="px-4 py-4 text-sm text-text-secondary">{sale.tenders.map((tender) => titleCase(tender.method)).join(" + ")}</td><td className="px-4 py-4">{sale.credit_amount > 0 ? <StatusPill tone="warn">{currency(sale.credit_amount, sale.total_currency)}</StatusPill> : "—"}</td><td className="px-4 py-4 font-semibold text-primary">{currency(sale.total_amount, sale.total_currency)}</td></tr>)}</tbody></table></div></Panel>

      <div className="mt-5 grid gap-5 md:grid-cols-2"><Panel><PanelHeader title="Clotures recentes" />{(cashQuery.data?.cash_sessions.length ?? 0) === 0 ? <EmptyState title="Aucune cloture" /> : <div className="divide-y divide-border">{(cashQuery.data?.cash_sessions ?? []).filter((session) => session.status === "closed").slice(-5).reverse().map((session) => <div key={session.id} className="px-4 py-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-primary">{new Date(session.closed_at ?? session.opened_at).toLocaleString("fr-CD")}</p><StatusPill tone={(session.variance?.cdf ?? 0) === 0 && (session.variance?.usd ?? 0) === 0 ? "ok" : "danger"}>Ecart {currency(session.variance?.cdf ?? 0, "CDF")} / {currency(session.variance?.usd ?? 0, "USD")}</StatusPill></div></div>)}</div>}</Panel><Panel><PanelHeader title="Ardoises ouvertes" />{(debtsQuery.data?.debts.filter((debt) => debt.status === "open").length ?? 0) === 0 ? <EmptyState title="Aucune ardoise ouverte" /> : <div className="divide-y divide-border">{(debtsQuery.data?.debts ?? []).filter((debt) => debt.status === "open").slice(0, 6).map((debt) => <div key={debt.id} className="flex items-center justify-between px-4 py-4"><div><p className="text-sm font-semibold text-primary">{debt.customer.name}</p><p className="text-xs text-text-secondary">{debt.customer.phone}</p></div><span className="font-semibold text-primary">{currency(debt.balance, debt.currency)}</span></div>)}</div>}</Panel></div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="border-t-2 border-success bg-surface p-5 shadow-line"><p className="text-xs font-semibold uppercase text-text-secondary">{label}</p><p className="mt-3 text-xl font-semibold text-primary">{value}</p></div>; }
