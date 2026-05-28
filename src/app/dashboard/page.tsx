"use client";

import { Activity, AlertTriangle, ArrowUpRight, ChefHat, ClipboardList, DollarSign, UsersRound } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import {
  useListMenuItemsQuery,
  useListRestaurantActivitiesQuery,
  useListStaffQuery,
} from "@/lib/services/mezani-api";
import { inventoryItems, reservations, salesSeries, serviceStats } from "@/lib/data/mock";
import { currency, percent } from "@/lib/utils";
import { ClientChart } from "@/components/charts/client-chart";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function DashboardPage() {
  const { restaurant, restaurantsQuery } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const staffQuery = useListStaffQuery(restaurantId, { skip: !restaurantId });
  const menuQuery = useListMenuItemsQuery({ restaurantId }, { skip: !restaurantId });
  const activitiesQuery = useListRestaurantActivitiesQuery(restaurantId, { skip: !restaurantId });

  const lowStock = inventoryItems.filter((item) => item.stock <= item.alert);
  const activeActivities = activitiesQuery.data?.activities.filter((activity) => activity.enabled).length ?? 0;
  const staffCount = staffQuery.data?.staff.length ?? 0;
  const menuCount = menuQuery.data?.items.length ?? 0;

  return (
    <div>
      <PageHeading eyebrow="Operations" title="Tableau de bord">
        Vue de service pour suivre les ventes, les commandes, les alertes de stock et la capacite de l'etablissement.
      </PageHeading>

      {restaurantsQuery.isLoading ? <LoadingState label="Chargement des etablissements" /> : null}
      {restaurantsQuery.isError ? (
        <ErrorState detail="Verifier que mezani-resto-api tourne sur http://localhost:8080." />
      ) : null}
      {!restaurantsQuery.isLoading && !restaurant ? (
        <EmptyState title="Aucun restaurant trouve" detail="L'API admin ne retourne pas encore d'etablissement." />
      ) : null}

      {restaurant ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metric icon={DollarSign} label="CA du jour" value={currency(serviceStats[0].value)} detail={serviceStats[0].delta} />
            <Metric icon={ClipboardList} label="Commandes" value={String(serviceStats[1].value)} detail={serviceStats[1].delta} />
            <Metric icon={UsersRound} label="Equipe active" value={String(staffCount)} detail="roles synchronises" />
            <Metric icon={ChefHat} label="Articles menu" value={String(menuCount)} detail="lecture API menu" />
            <Metric icon={Activity} label="Occupation" value={percent(serviceStats[2].value)} detail={`${activeActivities} activites`} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
            <Panel>
              <PanelHeader eyebrow={restaurant.name} title="Evolution des ventes" />
              <div className="h-[330px] px-2 py-4">
                <ClientChart>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesSeries} margin={{ left: 8, right: 20, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#27745f" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#27745f" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(21,21,21,0.08)" vertical={false} />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6b665e", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b665e", fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => [name === "sales" ? currency(Number(value)) : value, name === "sales" ? "Ventes" : "Commandes"]}
                        contentStyle={{ borderRadius: 8, borderColor: "rgba(21,21,21,0.12)" }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#27745f" fill="url(#sales)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ClientChart>
              </div>
            </Panel>

            <Panel>
              <PanelHeader eyebrow="Alertes" title="Priorites du service" />
              <div className="divide-y divide-ink/8">
                {lowStock.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-md bg-wine/10 text-wine">
                        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        <p className="text-xs text-ink/55">
                          {item.stock} {item.unit} restants
                        </p>
                      </div>
                    </div>
                    <StatusPill tone="danger">Seuil {item.alert}</StatusPill>
                  </div>
                ))}
                {reservations.slice(0, 3).map((reservation) => (
                  <div key={`${reservation.time}-${reservation.guest}`} className="flex items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-ink">{reservation.time} · {reservation.guest}</p>
                      <p className="text-xs text-ink/55">
                        {reservation.guests} couverts · {reservation.table}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-ink/36" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {(activitiesQuery.data?.activities ?? []).slice(0, 6).map((activity) => (
              <div key={activity.code} className="rounded-lg border border-ink/10 bg-white/64 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-ink">{activity.name}</h3>
                  <StatusPill tone={activity.enabled ? "ok" : "neutral"}>
                    {activity.enabled ? "Active" : "Inactive"}
                  </StatusPill>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink/58">{activity.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white/72 p-4 shadow-line">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink/58">{label}</p>
        <Icon className="h-4 w-4 text-basil" aria-hidden="true" />
      </div>
      <p className="mt-4 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-basil">{detail}</p>
    </div>
  );
}
