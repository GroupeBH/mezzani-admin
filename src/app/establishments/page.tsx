"use client";

import Link from "next/link";
import { Building2, MapPin, Plus, Settings2, WalletCards } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { StatusPill } from "@/components/ui/status-pill";

export default function EstablishmentsPage() {
  const {
    establishments,
    activeEstablishmentId,
    setActiveEstablishment,
    canCreateEstablishment,
    subscription,
    establishmentCount,
    isLoading,
    restaurantsQuery,
  } = useActiveRestaurant();

  return (
    <div>
      <PageHeading
        eyebrow="Organisation"
        title="Établissements"
        action={
          canCreateEstablishment ? (
            <Link className="inline-flex h-9 items-center gap-2 rounded-md bg-success px-3 text-sm font-semibold text-white" href="/establishments/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Ajouter un établissement
            </Link>
          ) : undefined
        }
      >
        Ouvrez un site pour charger uniquement ses commandes, ses stocks, son personnel et ses rapports.
      </PageHeading>

      <div className="mb-6 grid gap-4 border-y border-border bg-surface-elevated px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <WalletCards className="h-4 w-4 text-info" aria-hidden="true" />
            <p className="text-sm font-semibold text-primary">
              {subscription?.plan?.name ?? (subscription?.status === "LEGACY" ? "Accès historique" : "Forfait non activé")}
            </p>
            <StatusPill tone={subscription?.status === "ACTIVE" || subscription?.status === "LEGACY" ? "ok" : "warn"}>
              {subscription?.status ?? "INACTIF"}
            </StatusPill>
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            {establishmentCount} sur {subscription?.max_establishments ?? "∞"} établissement(s) utilisé(s).
            La clé reçue après paiement active cette capacité pour votre organisation.
          </p>
        </div>
        <Link className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-semibold text-primary hover:bg-surface" href="/subscription">
          Gérer le forfait
        </Link>
      </div>

      {isLoading ? <LoadingState label="Chargement des établissements" /> : null}
      {restaurantsQuery.isError ? <ErrorState detail="Impossible de charger les établissements autorisés pour ce compte." /> : null}
      {!isLoading && establishments.length === 0 ? (
        <EmptyState title="Aucun établissement" detail="Créez votre premier site pour commencer les opérations." />
      ) : null}

      <div className="divide-y divide-border border-y border-border bg-surface-elevated">
        {establishments.map((item) => {
          const active = item.id === activeEstablishmentId;
          return (
            <div key={item.id} className="grid gap-4 px-4 py-5 transition hover:bg-surface md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-white">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-primary">{item.name}</h2>
                    {active ? <StatusPill tone="info">Actif</StatusPill> : null}
                    <StatusPill tone={item.status === "ACTIVE" ? "ok" : item.status === "SUSPENDED" ? "danger" : "neutral"}>{item.status}</StatusPill>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {[item.address, item.commune, item.city].filter(Boolean).join(", ") || "Localisation à compléter"}
                  </p>
                </div>
              </div>
              <div className="text-sm">
                <p className="font-medium text-primary">{item.type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xs text-text-secondary">Rôle : {item.role ?? "MEMBRE"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button disabled={active} onClick={() => setActiveEstablishment(item.id)} variant={active ? "ghost" : "primary"}>
                  {active ? "Ouvert" : "Ouvrir"}
                </Button>
                {item.permissions?.includes("establishment:update") ? (
                  <Link className="grid h-9 w-9 place-items-center rounded-md border border-border text-text-secondary hover:text-primary" href={`/establishments/${item.id}/edit`} title="Modifier">
                    <Settings2 className="h-4 w-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {!canCreateEstablishment && establishments.length > 0 ? (
        <p className="mt-4 text-sm text-text-secondary">
          L’ajout est indisponible : abonnement expiré, permission absente ou plafond du forfait atteint. Consultez la page <Link className="font-semibold text-info" href="/subscription">Forfait</Link>.
        </p>
      ) : null}
    </div>
  );
}
