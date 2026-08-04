"use client";

import { FormEvent, useMemo, useState } from "react";
import { BadgeDollarSign, HandCoins, Phone, Search, UserRoundPlus } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useCreateDebtMutation, useListDebtsQuery, usePayDebtMutation } from "@/lib/services/mezani-api";
import type { CurrencyCode } from "@/lib/types";
import { currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const emptyDebt = { order_id: "", customer: { name: "", phone: "" }, currency: "CDF" as CurrencyCode, amount: 0, due_date: "", notes: "" };

export default function ClientsPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const debtsQuery = useListDebtsQuery(restaurantId, { skip: !restaurantId });
  const [createDebt, createState] = useCreateDebtMutation();
  const [payDebt, payState] = usePayDebtMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(emptyDebt);
  const [payment, setPayment] = useState({ debtId: "", amount: 0, method: "cash", reference: "" });
  const [message, setMessage] = useState<string | null>(null);

  const debts = debtsQuery.data?.debts ?? [];
  const filteredDebts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return debts.filter((debt) => (!term || debt.customer.name.toLowerCase().includes(term) || debt.customer.phone.includes(term)) && (!status || debt.status === status));
  }, [debts, search, status]);
  const totals = useMemo(() => debts.filter((debt) => debt.status === "open").reduce((sum, debt) => ({ cdf: sum.cdf + (debt.currency === "CDF" ? debt.balance : 0), usd: sum.usd + (debt.currency === "USD" ? debt.balance : 0) }), { cdf: 0, usd: 0 }), [debts]);

  async function submitDebt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!restaurantId) return; setMessage(null);
    try { await createDebt({ restaurantId, body: form }).unwrap(); setForm(emptyDebt); setMessage("Ardoise client enregistree."); }
    catch { setMessage("Impossible de creer cette ardoise."); }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!restaurantId || !payment.debtId) return; setMessage(null);
    try { await payDebt({ restaurantId, debtId: payment.debtId, amount: payment.amount, method: payment.method, reference: payment.reference }).unwrap(); setPayment({ debtId: "", amount: 0, method: "cash", reference: "" }); setMessage("Remboursement enregistre."); }
    catch { setMessage("Paiement refuse : le montant depasse peut-etre le solde restant."); }
  }

  return (
    <div>
      <PageHeading eyebrow="Clients" title="Ardoises et dettes">
        Chaque credit reste rattache a un nom, un telephone, une commande et un historique de remboursement.
      </PageHeading>
      {message ? <div className="mb-5 rounded-lg border border-info/20 bg-info-light px-4 py-3 text-sm font-medium text-info">{message}</div> : null}
      {debtsQuery.isLoading ? <LoadingState label="Chargement des ardoises" /> : null}
      {debtsQuery.isError ? <ErrorState detail="Les ardoises ne sont pas accessibles pour ce role." /> : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Summary label="A recuperer en CDF" value={currency(totals.cdf, "CDF")} />
        <Summary label="A recuperer en USD" value={currency(totals.usd, "USD")} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelHeader title="Comptes clients" action={<div className="flex flex-wrap gap-2"><label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" /><Field className="w-56 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom ou telephone" /></label><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Toutes</option><option value="open">A payer</option><option value="paid">Soldees</option></Select></div>} />
          {filteredDebts.length === 0 ? <EmptyState title="Aucune ardoise" detail="Les ventes a credit et les dettes saisies apparaitront ici." /> : null}
          <div className="divide-y divide-border">
            {filteredDebts.map((debt) => <button key={debt.id} type="button" onClick={() => setPayment((current) => ({ ...current, debtId: debt.id, amount: debt.balance }))} className="flex w-full flex-col gap-3 px-4 py-4 text-left transition hover:bg-surface-pressed sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-warning-light text-amber-700"><HandCoins className="h-4 w-4" /></span><div><p className="font-semibold text-primary">{debt.customer.name}</p><p className="flex items-center gap-1 text-xs text-text-secondary"><Phone className="h-3 w-3" />{debt.customer.phone}{debt.order_id ? ` · ${debt.order_id}` : ""}</p></div></div><div className="flex items-center gap-3 sm:text-right"><div><p className="font-semibold text-primary">{currency(debt.balance, debt.currency)}</p><p className="text-xs text-text-secondary">sur {currency(debt.original_amount, debt.currency)}</p></div><StatusPill tone={debt.status === "paid" ? "ok" : "warn"}>{debt.status === "paid" ? "Soldee" : "A payer"}</StatusPill></div></button>)}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Nouvelle ardoise" action={<UserRoundPlus className="h-4 w-4 text-info" />} />
            <form className="grid gap-3 p-4" onSubmit={submitDebt}>
              <Field value={form.customer.name} onChange={(event) => setForm((current) => ({ ...current, customer: { ...current.customer, name: event.target.value } }))} placeholder="Nom du client" required />
              <Field value={form.customer.phone} onChange={(event) => setForm((current) => ({ ...current, customer: { ...current.customer, phone: event.target.value } }))} placeholder="Telephone" required />
              <Field value={form.order_id} onChange={(event) => setForm((current) => ({ ...current, order_id: event.target.value }))} placeholder="Commande facultative" />
              <div className="grid grid-cols-[1fr_0.45fr] gap-3"><Field type="number" min="0" step="0.01" value={form.amount || ""} onChange={(event) => setForm((current) => ({ ...current, amount: Number(event.target.value) }))} placeholder="Montant" required /><Select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as CurrencyCode }))}><option>CDF</option><option>USD</option></Select></div>
              <Field type="date" value={form.due_date} onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))} />
              <Field value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Motif ou accord client" />
              <Button variant="primary" disabled={createState.isLoading}><BadgeDollarSign className="h-4 w-4" />Enregistrer</Button>
            </form>
          </Panel>

          <Panel>
            <PanelHeader title="Remboursement" eyebrow={payment.debtId || "Choisir une ardoise"} />
            <form className="grid gap-3 p-4" onSubmit={submitPayment}>
              <Field type="number" min="0" step="0.01" value={payment.amount || ""} onChange={(event) => setPayment((current) => ({ ...current, amount: Number(event.target.value) }))} placeholder="Montant recu" required />
              <Select value={payment.method} onChange={(event) => setPayment((current) => ({ ...current, method: event.target.value }))}><option value="cash">Especes</option><option value="mobile_money">Mobile Money</option><option value="card">Carte</option><option value="bank_transfer">Virement</option></Select>
              <Field value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} placeholder="Reference facultative" />
              <Button disabled={payState.isLoading || !payment.debtId}>Confirmer le remboursement</Button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="border-l-4 border-warning bg-surface px-5 py-4 shadow-line"><p className="text-sm text-text-secondary">{label}</p><p className="mt-2 text-2xl font-semibold text-primary">{value}</p></div>;
}
