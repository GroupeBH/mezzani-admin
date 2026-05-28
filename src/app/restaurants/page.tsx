"use client";

import { Check, Search, SlidersHorizontal, Store } from "lucide-react";
import { useMemo, useState } from "react";
import { setSelectedRestaurantId } from "@/lib/features/app-slice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  useGetAdminRestaurantQuery,
  useListAdminRestaurantsQuery,
  useListRestaurantActivitiesQuery,
} from "@/lib/services/mezani-api";
import type { RestaurantStatus, RestaurantType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Field, LoadingState, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function RestaurantsPage() {
  const dispatch = useAppDispatch();
  const selectedRestaurantId = useAppSelector((state) => state.app.selectedRestaurantId);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RestaurantStatus | "">("");
  const [type, setType] = useState<RestaurantType | "">("");
  const restaurantsQuery = useListAdminRestaurantsQuery({ search, status, type });
  const restaurants = restaurantsQuery.data?.restaurants ?? [];
  const activeId = selectedRestaurantId ?? restaurants[0]?.id ?? "";
  const detailQuery = useGetAdminRestaurantQuery(activeId, { skip: !activeId });
  const activitiesQuery = useListRestaurantActivitiesQuery(activeId, { skip: !activeId });

  const selected = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === activeId) ?? detailQuery.data ?? restaurants[0],
    [activeId, detailQuery.data, restaurants],
  );

  return (
    <div>
      <PageHeading
        eyebrow="Etablissements"
        title="Restaurants et points de vente"
        action={
          <Button variant="primary">
            <Store className="h-4 w-4" aria-hidden="true" />
            Nouveau
          </Button>
        }
      >
        Pilotage des etablissements visibles dans le back-office et verification rapide des modules actives.
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <PanelHeader
            title="Catalogue etablissements"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                  <Field
                    className="w-56 pl-9"
                    placeholder="Rechercher"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select value={status} onChange={(event) => setStatus(event.target.value as RestaurantStatus | "")}>
                  <option value="">Tous statuts</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
                <Select value={type} onChange={(event) => setType(event.target.value as RestaurantType | "")}>
                  <option value="">Tous types</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="bar">Bar</option>
                  <option value="club">Club</option>
                  <option value="other">Other</option>
                </Select>
              </div>
            }
          />

          {restaurantsQuery.isLoading ? <LoadingState /> : null}
          {restaurantsQuery.isError ? <ErrorState /> : null}
          {!restaurantsQuery.isLoading && restaurants.length === 0 ? (
            <EmptyState title="Aucun resultat" detail="Modifier les filtres ou verifier la connexion au backend." />
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/8 text-xs uppercase text-ink/45">
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Ville</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8">
                {restaurants.map((restaurant) => (
                  <tr key={restaurant.id} className="transition hover:bg-ink/[0.025]">
                    <td className="px-4 py-4">
                      <p className="font-medium text-ink">{restaurant.name}</p>
                      <p className="text-xs text-ink/52">{restaurant.slug}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-ink/66">{restaurant.type}</td>
                    <td className="px-4 py-4 text-sm text-ink/66">{restaurant.address.city}</td>
                    <td className="px-4 py-4 text-sm text-ink/66">{restaurant.contact.email}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={restaurant.status === "active" ? "ok" : restaurant.status === "draft" ? "warn" : "danger"}>
                        {restaurant.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4">
                      <Button
                        className="h-9"
                        variant={activeId === restaurant.id ? "primary" : "secondary"}
                        onClick={() => dispatch(setSelectedRestaurantId(restaurant.id))}
                      >
                        {activeId === restaurant.id ? <Check className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
                        Activer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Profil actif" eyebrow={selected?.status ?? "Aucun"} />
            {detailQuery.isFetching && !selected ? <LoadingState /> : null}
            {selected ? (
              <div className="space-y-5 p-4">
                <div>
                  <h2 className="text-xl font-semibold text-ink">{selected.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink/60">{selected.description || "Description non renseignee."}</p>
                </div>
                <div className="grid gap-3 text-sm">
                  <Info label="Adresse" value={`${selected.address.line1}, ${selected.address.city}`} />
                  <Info label="Pays" value={selected.address.country} />
                  <Info label="Email" value={selected.contact.email} />
                  <Info label="Telephone" value={selected.contact.phone} />
                  <Info label="Identifiant" value={selected.id} />
                </div>
              </div>
            ) : (
              <EmptyState title="Selection vide" />
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Activites activees" />
            <div className="grid gap-2 p-4">
              {(activitiesQuery.data?.activities ?? []).map((activity) => (
                <div key={activity.code} className="flex items-center justify-between gap-3 rounded-md border border-ink/8 bg-white/58 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{activity.name}</p>
                    <p className="text-xs text-ink/52">{activity.code}</p>
                  </div>
                  <StatusPill tone={activity.enabled ? "ok" : "neutral"}>
                    {activity.enabled ? "On" : "Off"}
                  </StatusPill>
                </div>
              ))}
              {!activitiesQuery.isFetching && (activitiesQuery.data?.activities.length ?? 0) === 0 ? (
                <EmptyState title="Aucune activite" />
              ) : null}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink/8 pb-3 last:border-b-0 last:pb-0">
      <span className="text-ink/48">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-ink">{value}</span>
    </div>
  );
}
