"use client";

import { FormEvent, useMemo, useState } from "react";
import { Banknote, CircleDollarSign, LockKeyhole, ReceiptText, Smartphone, WalletCards } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { enqueueOfflineOperation } from "@/lib/offline-queue";
import {
  useCloseCashSessionMutation,
  useGetCurrentCashSessionQuery,
  useGetLocalSettingsQuery,
  useListSalesQuery,
  useOpenCashSessionMutation,
  useRecordSaleMutation,
} from "@/lib/services/mezani-api";
import type { CurrencyCode, PaymentTender } from "@/lib/types";
import { convertCurrency, currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const emptyTender: PaymentTender = { method: "cash", currency: "CDF", amount: 0 };

export default function BillingPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const settingsQuery = useGetLocalSettingsQuery(restaurantId, { skip: !restaurantId });
  const cashQuery = useGetCurrentCashSessionQuery(restaurantId, { skip: !restaurantId });
  const salesQuery = useListSalesQuery(restaurantId, { skip: !restaurantId });
  const [openCash, openState] = useOpenCashSessionMutation();
  const [closeCash, closeState] = useCloseCashSessionMutation();
  const [recordSale, saleState] = useRecordSaleMutation();

  const settings = settingsQuery.data;
  const [opening, setOpening] = useState({ cdf: 0, usd: 0 });
  const [counted, setCounted] = useState({ cdf: 0, usd: 0 });
  const [closeReason, setCloseReason] = useState("Cloture de service");
  const [orderId, setOrderId] = useState("");
  const [total, setTotal] = useState(0);
  const [totalCurrency, setTotalCurrency] = useState<CurrencyCode>("CDF");
  const [tenders, setTenders] = useState<PaymentTender[]>([{ ...emptyTender }]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const cdfPerUsd = settings?.cdf_per_usd ?? 2800;
  const paidInTotalCurrency = useMemo(
    () =>
      tenders.reduce(
        (sum, tender) => sum + convertCurrency(tender.amount || 0, tender.currency, totalCurrency, cdfPerUsd),
        0,
      ),
    [cdfPerUsd, tenders, totalCurrency],
  );
  const remaining = Math.max(total - paidInTotalCurrency, 0);
  const change = Math.max(paidInTotalCurrency - total, 0);

  async function submitOpening(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurantId) return;
    setMessage(null);
    try {
      await openCash({ restaurantId, openingBalance: opening }).unwrap();
      setMessage("Caisse ouverte. Les ventes peuvent commencer.");
    } catch {
      setMessage("Impossible d'ouvrir la caisse avec ce compte.");
    }
  }

  async function submitSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurantId || !cashQuery.data || total <= 0) return;
    setMessage(null);
    const operationId = globalThis.crypto?.randomUUID?.() ?? `offline_${Date.now()}`;
    const body = {
      cash_session_id: cashQuery.data.id,
      order_id: orderId.trim(),
      idempotency_key: operationId,
      total_amount: total,
      total_currency: totalCurrency,
      cdf_per_usd: cdfPerUsd,
      tenders: tenders.filter((tender) => tender.amount > 0),
      customer: remaining > 0 ? customer : undefined,
      due_date: remaining > 0 ? dueDate : undefined,
      notes: remaining > 0 ? "Ardoise creee a l'encaissement" : undefined,
    };

    try {
      await recordSale({ restaurantId, body }).unwrap();
      setMessage(remaining > 0 ? "Vente enregistree avec une ardoise client." : "Vente encaissee et journalisee.");
      resetSale();
    } catch (error) {
      const networkFailure = !navigator.onLine || (typeof error === "object" && error !== null && "status" in error && (error as { status?: string }).status === "FETCH_ERROR");
      if (networkFailure) {
        enqueueOfflineOperation({ id: operationId, kind: "record_sale", restaurantId, createdAt: new Date().toISOString(), body });
        setMessage("Connexion absente : la vente est gardee sur cet appareil et sera synchronisee automatiquement.");
        resetSale();
        return;
      }
      setMessage("Encaissement refuse. Verifiez la caisse, les montants et les informations client.");
    }
  }

  async function submitClosing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!restaurantId || !cashQuery.data) return;
    setMessage(null);
    try {
      const closed = await closeCash({ restaurantId, cashSessionId: cashQuery.data.id, countedBalance: counted, reason: closeReason }).unwrap();
      setMessage(`Caisse cloturee. Ecart : ${currency(closed.variance?.cdf ?? 0, "CDF")} / ${currency(closed.variance?.usd ?? 0, "USD")}.`);
    } catch {
      setMessage("La cloture de caisse a ete refusee.");
    }
  }

  function resetSale() {
    setOrderId("");
    setTotal(0);
    setTenders([{ ...emptyTender, currency: settings?.primary_currency ?? "CDF" }]);
    setCustomer({ name: "", phone: "" });
    setDueDate("");
  }

  function updateTender(index: number, patch: Partial<PaymentTender>) {
    setTenders((current) => current.map((tender, currentIndex) => (currentIndex === index ? { ...tender, ...patch } : tender)));
  }

  const noCurrentCash = cashQuery.isError && (cashQuery.error as { status?: number } | undefined)?.status === 404;

  return (
    <div>
      <PageHeading eyebrow="Caisse" title="Encaissements CDF et USD">
        Ouvrez le service, encaissez en especes ou Mobile Money, partagez un paiement et suivez chaque ecart.
      </PageHeading>

      {settingsQuery.isLoading || cashQuery.isLoading ? <LoadingState label="Chargement de la caisse" /> : null}
      {settingsQuery.isError ? <ErrorState detail="Les parametres locaux ne sont pas accessibles pour cette session." /> : null}
      {message ? <div className="mb-5 rounded-lg border border-info/20 bg-info-light px-4 py-3 text-sm font-medium text-info">{message}</div> : null}

      {!cashQuery.data && (noCurrentCash || !cashQuery.isLoading) ? (
        <Panel className="max-w-2xl">
          <PanelHeader title="Ouvrir la caisse" eyebrow="Debut de service" />
          <form className="grid gap-4 p-5" onSubmit={submitOpening}>
            <p className="text-sm leading-6 text-text-secondary">Comptez le fonds disponible avant la premiere vente. Les deux monnaies restent separees jusqu'a la cloture.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <MoneyField label="Fonds CDF" currencyCode="CDF" value={opening.cdf} onChange={(value) => setOpening((current) => ({ ...current, cdf: value }))} />
              <MoneyField label="Fonds USD" currencyCode="USD" value={opening.usd} onChange={(value) => setOpening((current) => ({ ...current, usd: value }))} />
            </div>
            <Button variant="primary" disabled={openState.isLoading || !restaurantId}>
              <LockKeyhole className="h-4 w-4" />
              {openState.isLoading ? "Ouverture" : "Ouvrir le service"}
            </Button>
          </form>
        </Panel>
      ) : null}

      {cashQuery.data ? (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel>
            <PanelHeader title="Nouvel encaissement" eyebrow={`Taux : 1 USD = ${currency(cdfPerUsd, "CDF")}`} />
            <form className="grid gap-4 p-5" onSubmit={submitSale}>
              <div className="grid gap-3 sm:grid-cols-[1fr_0.7fr_0.45fr]">
                <Field value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Commande ou table (facultatif)" />
                <Field type="number" min="0" step="0.01" value={total || ""} onChange={(event) => setTotal(Number(event.target.value))} placeholder="Total" required />
                <Select value={totalCurrency} onChange={(event) => setTotalCurrency(event.target.value as CurrencyCode)}>
                  {(settings?.accepted_currencies ?? ["CDF", "USD"]).map((code) => <option key={code}>{code}</option>)}
                </Select>
              </div>

              <div className="divide-y divide-border border-y border-border">
                {tenders.map((tender, index) => (
                  <div key={index} className="grid gap-3 py-4 sm:grid-cols-[1fr_0.65fr_0.8fr_1fr]">
                    <Select value={tender.method} onChange={(event) => updateTender(index, { method: event.target.value as PaymentTender["method"] })}>
                      <option value="cash">Especes</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="card">Carte</option>
                      <option value="bank_transfer">Virement</option>
                    </Select>
                    <Select value={tender.currency} onChange={(event) => updateTender(index, { currency: event.target.value as CurrencyCode })}>
                      <option value="CDF">CDF</option><option value="USD">USD</option>
                    </Select>
                    <Field type="number" min="0" step="0.01" value={tender.amount || ""} onChange={(event) => updateTender(index, { amount: Number(event.target.value) })} placeholder="Montant" required={index === 0} />
                    {tender.method === "mobile_money" ? (
                      <Select value={tender.provider ?? "mpesa"} onChange={(event) => updateTender(index, { provider: event.target.value })}>
                        {(settings?.mobile_money_providers ?? ["mpesa", "airtel_money", "orange_money"]).map((provider) => <option key={provider} value={provider}>{providerLabel(provider)}</option>)}
                      </Select>
                    ) : <Field value={tender.reference ?? ""} onChange={(event) => updateTender(index, { reference: event.target.value })} placeholder="Reference facultative" />}
                  </div>
                ))}
              </div>

              <Button type="button" onClick={() => setTenders((current) => current.length === 1 ? [...current, { ...emptyTender, currency: totalCurrency }] : current.slice(0, 1))}>
                <WalletCards className="h-4 w-4" />
                {tenders.length === 1 ? "Partager le paiement" : "Retirer le second moyen"}
              </Button>

              {remaining > 0 ? (
                <div className="grid gap-3 rounded-lg bg-warning-light p-4 sm:grid-cols-2">
                  <p className="sm:col-span-2 text-sm font-semibold text-amber-800">Reste a payer : {currency(remaining, totalCurrency)} — une ardoise sera creee.</p>
                  <Field value={customer.name} onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))} placeholder="Nom du client" required />
                  <Field value={customer.phone} onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))} placeholder="Telephone" required />
                  <Field className="sm:col-span-2" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                </div>
              ) : null}

              <div className="flex flex-col gap-3 bg-primary p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs text-white/60">Recu converti</p><p className="text-xl font-semibold">{currency(paidInTotalCurrency, totalCurrency)}</p></div>
                <div className="sm:text-right"><p className="text-xs text-white/60">Monnaie a rendre</p><p className="text-xl font-semibold">{currency(change, totalCurrency)}</p></div>
              </div>
              <Button variant="primary" disabled={saleState.isLoading || total <= 0}>
                <ReceiptText className="h-4 w-4" />
                {saleState.isLoading ? "Enregistrement" : "Valider l'encaissement"}
              </Button>
            </form>
          </Panel>

          <div className="space-y-5">
            <Panel>
              <PanelHeader title="Caisse ouverte" eyebrow={new Date(cashQuery.data.opened_at).toLocaleTimeString("fr-CD", { hour: "2-digit", minute: "2-digit" })} />
              <div className="grid grid-cols-2 gap-px bg-border">
                <Balance label="Attendu CDF" value={currency(cashQuery.data.expected_balance.cdf, "CDF")} icon={Banknote} />
                <Balance label="Attendu USD" value={currency(cashQuery.data.expected_balance.usd, "USD")} icon={CircleDollarSign} />
              </div>
            </Panel>
            <Panel>
              <PanelHeader title="Cloturer le service" />
              <form className="grid gap-3 p-4" onSubmit={submitClosing}>
                <MoneyField label="Compte CDF" currencyCode="CDF" value={counted.cdf} onChange={(value) => setCounted((current) => ({ ...current, cdf: value }))} />
                <MoneyField label="Compte USD" currencyCode="USD" value={counted.usd} onChange={(value) => setCounted((current) => ({ ...current, usd: value }))} />
                <Field value={closeReason} onChange={(event) => setCloseReason(event.target.value)} placeholder="Motif" required />
                <Button disabled={closeState.isLoading}>Cloturer et calculer l'ecart</Button>
              </form>
            </Panel>
          </div>

          <Panel className="xl:col-span-2">
            <PanelHeader title="Ventes du service" eyebrow={`${salesQuery.data?.sales.length ?? 0} encaissements`} />
            {(salesQuery.data?.sales.length ?? 0) === 0 ? <EmptyState title="Aucune vente enregistree" detail="Les encaissements valides apparaitront ici." /> : null}
            <div className="divide-y divide-border">
              {(salesQuery.data?.sales ?? []).slice().reverse().slice(0, 12).map((sale) => (
                <div key={sale.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-sm font-semibold text-primary">{sale.order_id || sale.id}</p><p className="text-xs text-text-secondary">{new Date(sale.created_at).toLocaleString("fr-CD")}</p></div>
                  <div className="flex items-center gap-3"><StatusPill tone={sale.payment_status === "paid" ? "ok" : "warn"}>{sale.payment_status === "paid" ? "Payee" : "Ardoise"}</StatusPill><span className="font-semibold text-primary">{currency(sale.total_amount, sale.total_currency)}</span></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function MoneyField({ label, currencyCode, value, onChange }: { label: string; currencyCode: CurrencyCode; value: number; onChange: (value: number) => void }) {
  return <label className="grid gap-1.5 text-xs font-semibold uppercase text-text-secondary"><span>{label}</span><div className="relative"><Field className="pr-14" type="number" min="0" step={currencyCode === "CDF" ? "1" : "0.01"} value={value || ""} onChange={(event) => onChange(Number(event.target.value))} placeholder="0" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-disabled">{currencyCode}</span></div></label>;
}

function Balance({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Banknote }) {
  return <div className="bg-surface p-4"><Icon className="h-4 w-4 text-success" /><p className="mt-3 text-xs text-text-secondary">{label}</p><p className="mt-1 font-semibold text-primary">{value}</p></div>;
}

function providerLabel(value: string) {
  return ({ mpesa: "M-Pesa", airtel_money: "Airtel Money", orange_money: "Orange Money" } as Record<string, string>)[value] ?? value;
}
