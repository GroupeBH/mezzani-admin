"use client";

import { Building2, Mail, MapPin, Phone, Store, Wifi } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import {
  useGetAdminRestaurantQuery,
  useListRestaurantActivitiesQuery,
} from "@/lib/services/mezani-api";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function RestaurantPage() {
  const { restaurant, selectedRestaurantId, restaurantsQuery } = useActiveRestaurant();
  const restaurantId = selectedRestaurantId ?? "";
  const detailQuery = useGetAdminRestaurantQuery(restaurantId, { skip: !restaurantId });
  const activitiesQuery = useListRestaurantActivitiesQuery(restaurantId, { skip: !restaurantId });
  const currentRestaurant = detailQuery.data ?? restaurant;

  return (
    <div>
      <PageHeading
        eyebrow="Restaurant courant"
        title="Mon etablissement"
        action={
          <Button variant="primary">
            <Store className="h-4 w-4" aria-hidden="true" />
            Enregistrer
          </Button>
        }
      >
        Configuration operationnelle du restaurant administre par le tenancier et son equipe.
      </PageHeading>

      {restaurantsQuery.isLoading ? <LoadingState label="Chargement du restaurant" /> : null}
      {restaurantsQuery.isError ? (
        <ErrorState detail="Verifier que mezani-resto-api tourne et que le compte admin a acces au restaurant." />
      ) : null}
      {!restaurantsQuery.isLoading && !currentRestaurant ? (
        <EmptyState title="Aucun restaurant accessible" detail="L'API admin ne retourne pas encore de restaurant pour ce compte." />
      ) : null}

      {currentRestaurant ? (
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel>
            <PanelHeader title="Identite du restaurant" eyebrow={currentRestaurant.status} />
            <div className="grid gap-4 p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary text-white">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold text-primary">{currentRestaurant.name}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{currentRestaurant.description || "Description non renseignee."}</p>
                </div>
                <StatusPill tone={currentRestaurant.status === "active" ? "ok" : currentRestaurant.status === "draft" ? "warn" : "danger"}>
                  {currentRestaurant.status}
                </StatusPill>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field defaultValue={currentRestaurant.name} placeholder="Nom du restaurant" />
                <Field defaultValue={currentRestaurant.slug} placeholder="Slug" />
                <Select defaultValue={currentRestaurant.type}>
                  <option value="restaurant">Restaurant</option>
                  <option value="bar">Bar</option>
                  <option value="club">Club</option>
                  <option value="other">Autre</option>
                </Select>
                <Select defaultValue={currentRestaurant.status}>
                  <option value="draft">Brouillon</option>
                  <option value="active">Actif</option>
                  <option value="suspended">Suspendu</option>
                </Select>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Coordonnees" />
            <div className="grid gap-3 p-5">
              <Info icon={MapPin} label="Adresse" value={`${currentRestaurant.address.line1}, ${currentRestaurant.address.city}`} />
              <Info icon={Store} label="Pays" value={currentRestaurant.address.country} />
              <Info icon={Mail} label="Email" value={currentRestaurant.contact.email} />
              <Info icon={Phone} label="Telephone" value={currentRestaurant.contact.phone} />
              <Info icon={Wifi} label="Identifiant API" value={currentRestaurant.id} mono />
            </div>
          </Panel>

          <Panel className="xl:col-span-2">
            <PanelHeader title="Modules actives pour ce restaurant" eyebrow="Perimetre tenancier" />
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
              {(activitiesQuery.data?.activities ?? []).map((activity) => (
                <div key={activity.code} className="rounded-lg border border-border bg-surface p-4 shadow-line">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-primary">{activity.name}</h3>
                    <StatusPill tone={activity.enabled ? "ok" : "neutral"}>{activity.enabled ? "On" : "Off"}</StatusPill>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{activity.description}</p>
                </div>
              ))}
              {!activitiesQuery.isFetching && (activitiesQuery.data?.activities.length ?? 0) === 0 ? (
                <EmptyState title="Aucun module actif" />
              ) : null}
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-surface-elevated px-3 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-text-disabled">{label}</p>
        <p className={mono ? "mt-1 break-all font-mono text-sm text-primary" : "mt-1 text-sm font-medium text-primary"}>{value}</p>
      </div>
    </div>
  );
}
