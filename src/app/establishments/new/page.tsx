"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, MapPin, WalletCards } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { activeIdAfterCreation } from "@/lib/establishment-context";
import { useCreateEstablishmentMutation } from "@/lib/services/mezani-api";
import type { CreateEstablishmentRequest, CurrencyCode, EstablishmentType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";

const initialForm: CreateEstablishmentRequest = {
  name: "", type: "RESTAURANT", phone: "", email: "", address: "", commune: "", district: "",
  city: "Kinshasa", country: "CD", primary_currency: "CDF", accepted_currencies: ["CDF"],
  exchange_rate: 2800, timezone: "Africa/Kinshasa", payment_methods: ["cash", "mobile_money"],
  operational_features: ["table_service", "counter_sale", "takeaway", "stock"],
};

export default function NewEstablishmentPage() {
  const router = useRouter();
  const {
    canCreateEstablishment,
    isLoading,
    setActiveEstablishment,
    subscription,
    establishmentCount,
  } = useActiveRestaurant();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [createEstablishment, createState] = useCreateEstablishmentMutation();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      const created = await createEstablishment(form).unwrap();
      setActiveEstablishment(activeIdAfterCreation(created.id));
      router.push("/dashboard");
    } catch (error) {
      setMessage(apiError(error));
    }
  }

  if (isLoading) return <LoadingState label="Vérification des droits de création" />;

  if (!canCreateEstablishment && !createState.isLoading) {
    return (
      <div>
        <PageHeading eyebrow="Création indisponible" title="Vérifiez votre forfait">
          L’abonnement est expiré, la permission manque ou le plafond d’établissements est atteint.
        </PageHeading>
        <Link className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white" href="/subscription">
          Choisir ou activer un forfait
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <PageHeading eyebrow="Nouvel établissement" title="Configurer le site" action={<Button disabled={createState.isLoading || !form.name.trim()} type="submit" variant="primary">{createState.isLoading ? "Création…" : "Créer et ouvrir"}<ArrowRight className="h-4 w-4" /></Button>}>
        Votre clé a activé {subscription?.plan?.name ?? "le forfait de l’organisation"} : {establishmentCount} sur {subscription?.max_establishments ?? "∞"} établissement(s) utilisé(s).
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel>
          <PanelHeader title="Informations générales" eyebrow="Identité" />
          <div className="grid gap-3 p-5">
            <label className="grid gap-1.5 text-xs font-semibold text-text-secondary">Nom<Field value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Maison MEZANI Gombe" required /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-text-secondary">Type<Select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as EstablishmentType }))}>{(["RESTAURANT", "BAR", "MAQUIS", "LOUNGE", "TERRACE", "FAST_FOOD", "CAFE", "OTHER"] as const).map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</Select></label>
            <Field value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="+243…" />
            <Field value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="site@exemple.com" type="email" />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Localisation" eyebrow="Kinshasa par défaut" />
          <div className="grid gap-3 p-5">
            <Field value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Adresse" />
            <div className="grid grid-cols-2 gap-3"><Field value={form.commune} onChange={(event) => setForm((current) => ({ ...current, commune: event.target.value }))} placeholder="Commune" /><Field value={form.district} onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))} placeholder="Quartier" /></div>
            <div className="grid grid-cols-2 gap-3"><Field value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Ville" required /><Field value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder="Pays" required /></div>
            <div className="flex items-center gap-2 text-xs text-text-secondary"><MapPin className="h-3.5 w-3.5" /> Fuseau : Africa/Kinshasa</div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Finance et opérations" eyebrow="Démarrage" />
          <div className="grid gap-3 p-5">
            <label className="grid gap-1.5 text-xs font-semibold text-text-secondary">Devise principale<Select value={form.primary_currency} onChange={(event) => setForm((current) => ({ ...current, primary_currency: event.target.value as CurrencyCode }))}><option value="CDF">CDF</option><option value="USD">USD</option></Select></label>
            <label className="flex items-center gap-2 text-sm text-primary"><input type="checkbox" checked={form.accepted_currencies.includes("USD")} onChange={(event) => setForm((current) => ({ ...current, accepted_currencies: event.target.checked ? ["CDF", "USD"] : ["CDF"] }))} /> Accepter USD</label>
            <Field type="number" min="0" step="0.01" value={form.exchange_rate ?? ""} onChange={(event) => setForm((current) => ({ ...current, exchange_rate: Number(event.target.value) }))} placeholder="Taux CDF/USD" />
            <div className="border-t border-border pt-3"><p className="text-xs font-semibold uppercase text-text-disabled">Modules initiaux</p><p className="mt-2 text-sm leading-6 text-text-secondary">Salle, comptoir, vente à emporter et stock. Le bar, la cuisine et les réservations restent configurables.</p></div>
            <div className="flex items-center gap-2 text-xs text-text-secondary"><WalletCards className="h-3.5 w-3.5" /> Espèces et mobile money activés</div>
          </div>
        </Panel>
      </div>
      {message ? <p className="mt-4 text-sm font-medium text-danger">{message}</p> : null}
      <div className="mt-5 flex items-center gap-2 text-xs text-text-secondary"><Building2 className="h-3.5 w-3.5" /> L’adhésion du créateur sera ajoutée automatiquement.</div>
    </form>
  );
}

function apiError(error: unknown) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data && "error" in data && typeof data.error === "string") return data.error;
  }
  return "La création a échoué. Vérifiez le réseau et les informations saisies.";
}
