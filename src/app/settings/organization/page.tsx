"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, WalletCards } from "lucide-react";
import { useGetCurrentOrganizationQuery } from "@/lib/services/mezani-api";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function OrganizationSettingsPage() {
  const query = useGetCurrentOrganizationQuery();
  if (query.isLoading) return <LoadingState label="Chargement de l’organisation" />;
  if (query.isError || !query.data) return <ErrorState detail="L’organisation courante n’est pas accessible." />;
  const {
    organization,
    membership,
    establishment_count: count,
    subscription,
  } = query.data;
  const maximum = subscription.max_establishments;

  return (
    <div>
      <PageHeading eyebrow="Paramètres" title="Organisation">
        Identité du compte, autorisations globales et capacité issue du forfait payé.
      </PageHeading>

      <Panel>
        <PanelHeader title={organization.name} eyebrow={organization.slug} />
        <dl className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <Item label="Statut de l’organisation">
            <StatusPill tone={organization.status === "SUSPENDED" ? "danger" : "ok"}>{organization.status}</StatusPill>
          </Item>
          <Item label="Votre rôle">{membership.role}</Item>
          <Item label="Établissements">{count}</Item>
          <Item label="Plafond du forfait">{maximum ?? "Illimité"}</Item>
        </dl>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <Panel>
          <PanelHeader
            title={subscription.plan?.name ?? (subscription.status === "LEGACY" ? "Accès historique" : "Forfait non activé")}
            eyebrow="Abonnement"
            action={<WalletCards className="h-4 w-4 text-info" aria-hidden="true" />}
          />
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <Item label="Statut">
              <StatusPill tone={subscription.status === "ACTIVE" || subscription.status === "LEGACY" ? "ok" : "warn"}>
                {subscription.status}
              </StatusPill>
            </Item>
            <Item label="Utilisation">{count} / {maximum ?? "∞"}</Item>
            <Item label="Échéance">
              <span className="inline-flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-text-disabled" aria-hidden="true" />
                {subscription.expires_at ? new Date(subscription.expires_at).toLocaleDateString("fr-CD") : "Non applicable"}
              </span>
            </Item>
          </div>
        </Panel>
        <Link className="inline-flex h-11 items-center justify-center gap-2 self-center rounded-md bg-primary px-4 text-sm font-semibold text-white" href="/subscription">
          Gérer le forfait
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-text-disabled">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-primary">{children}</dd>
    </div>
  );
}
