"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  KeyRound,
  Smartphone,
} from "lucide-react";
import { isAccountSession } from "@/lib/features/auth-slice";
import { useAppSelector } from "@/lib/hooks";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import {
  useActivateSubscriptionMutation,
  useCreateSubscriptionCheckoutMutation,
  useListSubscriptionPlansQuery,
} from "@/lib/services/mezani-api";
import type { SubscriptionCheckout, SubscriptionPlan } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const paymentMethods = [
  { value: "mpesa", label: "M-Pesa" },
  { value: "airtel_money", label: "Airtel Money" },
  { value: "orange_money", label: "Orange Money" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "cash", label: "Paiement auprès de MEZANI" },
];

export default function SubscriptionPage() {
  const session = useAppSelector((state) => state.auth.session);
  const accountSession = session && isAccountSession(session) ? session : null;
  const {
    subscription,
    establishmentCount,
    canCreateEstablishment,
    organization,
  } = useActiveRestaurant();
  const plansQuery = useListSubscriptionPlansQuery();
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [activationKey, setActivationKey] = useState("");
  const [checkout, setCheckout] = useState<SubscriptionCheckout | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createCheckout, checkoutState] = useCreateSubscriptionCheckoutMutation();
  const [activateSubscription, activationState] = useActivateSubscriptionMutation();

  const plans = useMemo(() => plansQuery.data?.plans ?? [], [plansQuery.data?.plans]);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  if (!accountSession) {
    return (
      <ErrorState detail="Les forfaits multi-établissements sont accessibles avec un compte propriétaire MEZANI." />
    );
  }

  const accountUser = accountSession.user;

  const maximum = subscription?.max_establishments ?? null;
  const used = establishmentCount;
  const progress = maximum === null ? 0 : Math.min(100, Math.round((used / maximum) * 100));

  async function requestCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;
    setNotice(null);
    try {
      const created = await createCheckout({
        plan_id: selectedPlan.id,
        email: accountUser.email,
        phone: accountUser.phone,
        payment_method: paymentMethod,
      }).unwrap();
      setCheckout(created);
      setNotice(
        "Demande enregistrée. Après vérification du paiement, MEZANI enverra la clé d’activation au contact de votre compte.",
      );
    } catch (error) {
      setNotice(apiError(error, "La demande de paiement n’a pas pu être enregistrée."));
    }
  }

  async function redeemKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activationKey.trim()) return;
    setNotice(null);
    try {
      await activateSubscription({ key: activationKey.trim() }).unwrap();
      setActivationKey("");
      setCheckout(null);
      setNotice("Forfait activé. Votre nouveau plafond d’établissements est maintenant appliqué.");
    } catch (error) {
      setNotice(apiError(error, "Cette clé ne peut pas activer le forfait de cette organisation."));
    }
  }

  return (
    <div>
      <PageHeading eyebrow="Compte et capacité" title="Forfait MEZANI">
        Le paiement génère une clé personnelle. Cette clé active le forfait et le nombre
        d’établissements autorisés pour votre organisation.
      </PageHeading>

      {notice ? (
        <div className="mb-5 border-l-4 border-info bg-info-light px-4 py-3 text-sm font-medium text-info">
          {notice}
        </div>
      ) : null}

      <section className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
        <div className="border border-border bg-primary px-5 py-6 text-white sm:px-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/65">
                {organization?.name ?? "Votre organisation"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {subscription?.plan?.name ??
                  (subscription?.status === "LEGACY" ? "Accès historique" : "Aucun forfait actif")}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {canCreateEstablishment
                  ? "Vous pouvez encore ajouter un établissement dans la limite disponible."
                  : maximum !== null && used >= maximum
                    ? "Le plafond est atteint. Choisissez un forfait supérieur pour continuer."
                    : "Activez une clé issue d’un paiement confirmé pour ajouter un établissement."}
              </p>
            </div>
            <StatusPill tone={subscription?.status === "ACTIVE" || subscription?.status === "LEGACY" ? "ok" : "warn"}>
              {subscription?.status ?? "NON ACTIVÉ"}
            </StatusPill>
          </div>

          <div className="mt-8 flex items-end gap-3">
            <span className="text-5xl font-semibold tabular-nums">{used}</span>
            <span className="pb-1 text-sm text-white/65">
              sur {maximum ?? "∞"} établissement{maximum === 1 ? "" : "s"}
            </span>
          </div>
          {maximum !== null ? (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15" aria-label={`${used} établissements sur ${maximum}`}>
              <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {maximum === null ? "Plafond historique" : `${Math.max(0, maximum - used)} place(s) disponible(s)`}
            </span>
            {subscription?.expires_at ? (
              <span className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                Échéance {new Date(subscription.expires_at).toLocaleDateString("fr-CD")}
              </span>
            ) : null}
          </div>
        </div>

        <Panel>
          <PanelHeader title="J’ai reçu ma clé" eyebrow="Après paiement" action={<KeyRound className="h-4 w-4 text-info" />} />
          <form className="grid gap-3 p-5" onSubmit={redeemKey}>
            <p className="text-sm leading-6 text-text-secondary">
              Saisissez la clé envoyée par MEZANI pour activer ou renouveler la capacité de cette organisation.
            </p>
            <Field
              autoComplete="off"
              placeholder="MZ-XXXX-XXXX"
              value={activationKey}
              onChange={(event) => setActivationKey(event.target.value)}
              required
            />
            <Button disabled={activationState.isLoading || !activationKey.trim()} type="submit" variant="primary">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              {activationState.isLoading ? "Activation…" : "Activer le forfait"}
            </Button>
          </form>
        </Panel>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel>
          <PanelHeader title="Choisir une capacité" eyebrow="Forfaits disponibles" />
          {plansQuery.isLoading ? <LoadingState label="Chargement des forfaits" /> : null}
          {plansQuery.isError ? <div className="p-5"><ErrorState detail="Le catalogue des forfaits est indisponible." /></div> : null}
          {!plansQuery.isLoading && !plansQuery.isError && plans.length === 0 ? (
            <div className="p-5">
              <ErrorState detail="Les tarifs sont encore en configuration par l’équipe MEZANI." />
            </div>
          ) : null}
          <div className="divide-y divide-border">
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                selected={plan.id === selectedPlanId}
                onSelect={() => setSelectedPlanId(plan.id)}
              />
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Demander l’activation" eyebrow="Paiement local" action={<Smartphone className="h-4 w-4 text-success" />} />
          <form className="grid gap-4 p-5" onSubmit={requestCheckout}>
            <div>
              <p className="text-xs font-semibold uppercase text-text-disabled">Forfait choisi</p>
              <p className="mt-1 text-base font-semibold text-primary">
                {selectedPlan ? `${selectedPlan.name} · ${formatPlanPrice(selectedPlan)}` : "Sélectionnez un forfait"}
              </p>
            </div>
            <label className="grid gap-1.5 text-xs font-semibold text-text-secondary">
              Moyen de paiement
              <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </Select>
            </label>
            <p className="text-xs leading-5 text-text-secondary">
              La clé n’est émise qu’après confirmation du paiement par MEZANI. Elle sera liée à
              {accountUser.phone ? ` ${accountUser.phone}` : ` ${accountUser.email}`}.
            </p>
            <Button disabled={!selectedPlan || checkoutState.isLoading} type="submit" variant="primary">
              {checkoutState.isLoading ? "Enregistrement…" : "Continuer avec ce forfait"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            {checkout ? (
              <div className="border border-success/30 bg-success-light px-3 py-3 text-xs text-emerald-800">
                <p className="font-semibold">Demande {checkout.id}</p>
                <p className="mt-1">Montant : {formatPlanPrice(checkout.plan)} · statut {checkout.status}</p>
              </div>
            ) : null}
          </form>
        </Panel>
      </div>

      {canCreateEstablishment ? (
        <div className="mt-5 flex justify-end">
          <Link className="inline-flex h-10 items-center gap-2 rounded-md bg-success px-4 text-sm font-semibold text-white" href="/establishments/new">
            Ajouter un établissement
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function PlanRow({ plan, selected, onSelect }: { plan: SubscriptionPlan; selected: boolean; onSelect: () => void }) {
  return (
    <button
      className={`grid w-full gap-3 px-5 py-5 text-left transition sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-center ${
        selected ? "bg-info-light" : "hover:bg-surface"
      }`}
      type="button"
      onClick={onSelect}
    >
      <span>
        <span className="block text-sm font-semibold text-primary">{plan.name}</span>
        <span className="mt-1 block text-xs leading-5 text-text-secondary">{plan.description}</span>
      </span>
      <span className="text-sm font-semibold text-primary">
        {plan.max_establishments} établissement{plan.max_establishments > 1 ? "s" : ""}
      </span>
      <span className="text-sm font-semibold text-info">{formatPlanPrice(plan)}</span>
    </button>
  );
}

function formatPlanPrice(plan: Pick<SubscriptionPlan, "price_amount_minor" | "currency" | "billing_period_months">) {
  const amount = plan.price_amount_minor / 100;
  const formatted = new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: plan.currency === "CDF" ? 0 : 2,
  }).format(amount);
  return `${formatted} / ${plan.billing_period_months > 1 ? `${plan.billing_period_months} mois` : "mois"}`;
}

function apiError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data) {
      if ("error" in data && typeof data.error === "string") return data.error;
      if ("message" in data && typeof data.message === "string") return data.message;
    }
  }
  return fallback;
}
