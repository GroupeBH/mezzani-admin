"use client";

import { Clock, Globe2, KeyRound, Settings2 } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useListRestaurantActivitiesQuery, useListRestaurantRolesQuery } from "@/lib/services/mezani-api";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function SettingsPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const rolesQuery = useListRestaurantRolesQuery(restaurantId, { skip: !restaurantId });
  const activitiesQuery = useListRestaurantActivitiesQuery(restaurantId, { skip: !restaurantId });

  return (
    <div>
      <PageHeading
        eyebrow="Configuration"
        title="Parametres et gouvernance"
        action={
          <Button variant="primary">
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Enregistrer
          </Button>
        }
      >
        Reglages d'etablissement, devises, taxes, horaires et apercu des permissions.
      </PageHeading>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <PanelHeader title="Etablissement" eyebrow={restaurant?.slug} />
          <div className="grid gap-3 p-4">
            <Field defaultValue={restaurant?.name ?? ""} placeholder="Nom etablissement" />
            <Field defaultValue={restaurant?.contact.email ?? ""} placeholder="Email contact" />
            <Field defaultValue={restaurant?.contact.phone ?? ""} placeholder="Telephone" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Select defaultValue="USD">
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
                <option value="EUR">EUR</option>
              </Select>
              <Field defaultValue="16" placeholder="TVA %" />
              <Select defaultValue={restaurant?.type ?? "restaurant"}>
                <option value="restaurant">Restaurant</option>
                <option value="bar">Bar</option>
                <option value="club">Club</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Horaires" action={<Clock className="h-4 w-4 text-ink/45" />} />
          <div className="grid gap-3 p-4">
            {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day, index) => (
              <div key={day} className="grid grid-cols-[1fr_96px_96px] items-center gap-3">
                <p className="text-sm font-medium text-ink">{day}</p>
                <Field defaultValue={index === 6 ? "12:00" : "09:00"} />
                <Field defaultValue={index >= 4 ? "23:30" : "22:00"} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Modules actifs" action={<Globe2 className="h-4 w-4 text-ink/45" />} />
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {(activitiesQuery.data?.activities ?? []).map((activity) => (
              <div key={activity.code} className="flex items-center justify-between rounded-md border border-ink/8 bg-white/60 px-3 py-3">
                <span className="text-sm font-medium text-ink">{activity.name}</span>
                <StatusPill tone={activity.enabled ? "ok" : "neutral"}>{activity.enabled ? "On" : "Off"}</StatusPill>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Permissions" action={<KeyRound className="h-4 w-4 text-ink/45" />} />
          <div className="divide-y divide-ink/8">
            {(rolesQuery.data?.roles ?? []).map((role) => (
              <div key={role.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{role.name}</p>
                  <StatusPill tone={role.is_system ? "info" : "neutral"}>{role.is_system ? "Systeme" : "Custom"}</StatusPill>
                </div>
                <p className="mt-2 text-xs leading-5 text-ink/55">{role.permissions.join(", ")}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
