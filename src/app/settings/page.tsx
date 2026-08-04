"use client";

import { FormEvent, useEffect, useState } from "react";
import { Coins, History, KeyRound, MapPin, Settings2, Smartphone } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import {
  useGetLocalSettingsQuery,
  useListAuditQuery,
  useListRestaurantActivitiesQuery,
  useListRestaurantRolesQuery,
  useUpdateLocalSettingsMutation,
} from "@/lib/services/mezani-api";
import type { CurrencyCode } from "@/lib/types";
import { currency, titleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const fallback = {
  commune: "",
  quarter: "",
  timezone: "Africa/Kinshasa",
  primary_currency: "CDF" as CurrencyCode,
  accepted_currencies: ["CDF", "USD"] as CurrencyCode[],
  cdf_per_usd: 2800,
  payment_methods: ["cash", "mobile_money", "card", "bank_transfer", "credit"],
  mobile_money_providers: ["mpesa", "airtel_money", "orange_money"],
};

export default function SettingsPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const settingsQuery = useGetLocalSettingsQuery(restaurantId, { skip: !restaurantId });
  const rolesQuery = useListRestaurantRolesQuery(restaurantId, { skip: !restaurantId });
  const activitiesQuery = useListRestaurantActivitiesQuery(restaurantId, { skip: !restaurantId });
  const auditQuery = useListAuditQuery({ restaurantId, limit: 20 }, { skip: !restaurantId });
  const [updateSettings, updateState] = useUpdateLocalSettingsMutation();
  const [form, setForm] = useState(fallback);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!settingsQuery.data) return;
    const { restaurant_id: _restaurantId, updated_at: _updatedAt, updated_by: _updatedBy, ...editable } = settingsQuery.data;
    setForm(editable);
  }, [settingsQuery.data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!restaurantId) return; setMessage(null);
    try { await updateSettings({ restaurantId, body: form }).unwrap(); setMessage("Parametres locaux enregistres et journalises."); }
    catch { setMessage("Enregistrement refuse. Seul un gerant autorise peut modifier ces parametres."); }
  }

  function toggleCurrency(code: CurrencyCode) {
    setForm((current) => {
      const selected = current.accepted_currencies.includes(code);
      const accepted = selected ? current.accepted_currencies.filter((entry) => entry !== code) : [...current.accepted_currencies, code];
      return { ...current, accepted_currencies: accepted.length ? accepted : [code], primary_currency: accepted.includes(current.primary_currency) ? current.primary_currency : code };
    });
  }

  return (
    <div>
      <PageHeading eyebrow="Configuration" title="Reglages pour Kinshasa">
        Commune, quartier, monnaies, taux du jour et moyens d'encaissement de l'etablissement.
      </PageHeading>
      {message ? <div className="mb-5 rounded-lg border border-info/20 bg-info-light px-4 py-3 text-sm font-medium text-info">{message}</div> : null}
      {settingsQuery.isLoading ? <LoadingState label="Chargement des parametres" /> : null}
      {settingsQuery.isError ? <ErrorState detail="Les parametres locaux ne sont pas disponibles." /> : null}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel>
          <PanelHeader title="Monnaies et localisation" eyebrow={restaurant?.name} action={<Coins className="h-4 w-4 text-success" />} />
          <form className="grid gap-5 p-5" onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold uppercase text-text-secondary"><span>Commune</span><Field value={form.commune} onChange={(event) => setForm((current) => ({ ...current, commune: event.target.value }))} placeholder="Gombe, Bandalungwa..." /></label>
              <label className="grid gap-1.5 text-xs font-semibold uppercase text-text-secondary"><span>Quartier</span><Field value={form.quarter} onChange={(event) => setForm((current) => ({ ...current, quarter: event.target.value }))} placeholder="Quartier" /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr]">
              <label className="grid gap-1.5 text-xs font-semibold uppercase text-text-secondary"><span>Devise principale</span><Select value={form.primary_currency} onChange={(event) => setForm((current) => ({ ...current, primary_currency: event.target.value as CurrencyCode }))}>{form.accepted_currencies.map((code) => <option key={code}>{code}</option>)}</Select></label>
              <label className="grid gap-1.5 text-xs font-semibold uppercase text-text-secondary"><span>Taux applique — CDF pour 1 USD</span><Field type="number" min="1" step="1" value={form.cdf_per_usd} onChange={(event) => setForm((current) => ({ ...current, cdf_per_usd: Number(event.target.value) }))} required /></label>
            </div>
            <div><p className="text-xs font-semibold uppercase text-text-secondary">Monnaies acceptees</p><div className="mt-2 flex gap-2">{(["CDF", "USD"] as CurrencyCode[]).map((code) => <button type="button" key={code} onClick={() => toggleCurrency(code)} className={`h-10 min-w-24 rounded-md border px-4 text-sm font-semibold transition ${form.accepted_currencies.includes(code) ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-secondary"}`}>{code}</button>)}</div></div>
            <div className="bg-surface-elevated p-4"><p className="text-sm font-semibold text-primary">Apercu du taux</p><p className="mt-1 text-sm text-text-secondary">10 USD = {currency(form.cdf_per_usd * 10, "CDF")} · {currency(form.cdf_per_usd, "CDF")} = 1 USD</p></div>
            <Button variant="primary" disabled={updateState.isLoading}><Settings2 className="h-4 w-4" />{updateState.isLoading ? "Enregistrement" : "Enregistrer les reglages"}</Button>
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Moyens de paiement" action={<Smartphone className="h-4 w-4 text-info" />} />
            <div className="grid grid-cols-2 gap-px bg-border">{form.payment_methods.map((method) => <div key={method} className="flex items-center justify-between bg-surface px-4 py-3"><span className="text-sm font-medium text-primary">{titleCase(method)}</span><StatusPill tone="ok">Actif</StatusPill></div>)}</div>
            <div className="border-t border-border px-4 py-3 text-sm text-text-secondary">Mobile Money : {form.mobile_money_providers.map(providerLabel).join(", ")}</div>
          </Panel>
          <Panel>
            <PanelHeader title="Modules actifs" action={<MapPin className="h-4 w-4 text-text-secondary" />} />
            <div className="divide-y divide-border">{(activitiesQuery.data?.activities ?? []).map((activity) => <div key={activity.code} className="flex items-center justify-between px-4 py-3"><span className="text-sm font-medium text-primary">{activity.name}</span><StatusPill tone={activity.enabled ? "ok" : "neutral"}>{activity.enabled ? "Actif" : "Inactif"}</StatusPill></div>)}</div>
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Roles et perimetres" action={<KeyRound className="h-4 w-4 text-warning" />} />
          <div className="divide-y divide-border">{(rolesQuery.data?.roles ?? []).map((role) => <div key={role.id} className="px-4 py-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-primary">{role.name}</p><StatusPill tone={role.is_system ? "info" : "neutral"}>{role.is_system ? "Systeme" : "Personnalise"}</StatusPill></div><p className="mt-2 text-xs leading-5 text-text-secondary">{role.permissions.join(", ")}</p></div>)}</div>
        </Panel>

        <Panel>
          <PanelHeader title="Journal recent" eyebrow="Non modifiable" action={<History className="h-4 w-4 text-info" />} />
          {auditQuery.isError ? <div className="p-4"><ErrorState detail="Le journal est reserve au gerant." /></div> : <div className="divide-y divide-border">{(auditQuery.data?.entries ?? []).map((entry) => <div key={entry.id} className="px-4 py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-primary">{titleCase(entry.action)}</p><time className="text-xs text-text-disabled">{new Date(entry.occurred_at).toLocaleString("fr-CD")}</time></div><p className="mt-1 text-xs text-text-secondary">{entry.resource} · {entry.resource_id}{entry.reason ? ` · ${entry.reason}` : ""}</p></div>)}</div>}
        </Panel>
      </div>
    </div>
  );
}

function providerLabel(value: string) {
  return ({ mpesa: "M-Pesa", airtel_money: "Airtel Money", orange_money: "Orange Money" } as Record<string, string>)[value] ?? value;
}
