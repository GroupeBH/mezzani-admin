"use client";

import { AlertTriangle, Banknote, ChefHat, CircleDollarSign, ClipboardList, HandCoins, ShieldCheck, UsersRound } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import {
  useGetDailySummaryQuery,
  useGetLocalSettingsQuery,
  useListAuditQuery,
  useListMenuItemsQuery,
  useListRestaurantActivitiesQuery,
  useListStaffQuery,
  useListStockQuery,
} from "@/lib/services/mezani-api";
import { currency, titleCase } from "@/lib/utils";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function DashboardPage() {
  const { restaurant, restaurantsQuery } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const summaryQuery = useGetDailySummaryQuery({ restaurantId }, { skip: !restaurantId });
  const settingsQuery = useGetLocalSettingsQuery(restaurantId, { skip: !restaurantId });
  const stockQuery = useListStockQuery(restaurantId, { skip: !restaurantId });
  const staffQuery = useListStaffQuery(restaurantId, { skip: !restaurantId });
  const menuQuery = useListMenuItemsQuery({ restaurantId }, { skip: !restaurantId });
  const activitiesQuery = useListRestaurantActivitiesQuery(restaurantId, { skip: !restaurantId });
  const auditQuery = useListAuditQuery({ restaurantId, limit: 8 }, { skip: !restaurantId });
  const summary = summaryQuery.data;
  const lowStock = (stockQuery.data?.items ?? []).filter((item) => item.quantity <= item.alert_quantity);

  return (
    <div>
      <PageHeading eyebrow="Etat de la journee" title="Tableau de bord">
        Ventes, caisse, ardoises et alertes du service courant — sans chiffres de demonstration.
      </PageHeading>

      {restaurantsQuery.isLoading || summaryQuery.isLoading ? <LoadingState label="Chargement de l'activite" /> : null}
      {restaurantsQuery.isError ? <ErrorState detail="Le restaurant n'est pas accessible." /> : null}
      {!restaurantsQuery.isLoading && !restaurant ? <EmptyState title="Aucun etablissement" /> : null}

      {restaurant ? <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Metric icon={Banknote} label="Ventes CDF" value={currency(summary?.sales.cdf ?? 0, "CDF")} detail={`${summary?.sales_count ?? 0} encaissements`} />
          <Metric icon={CircleDollarSign} label="Ventes USD" value={currency(summary?.sales.usd ?? 0, "USD")} detail={`1 USD = ${currency(settingsQuery.data?.cdf_per_usd ?? 2800, "CDF")}`} />
          <Metric icon={HandCoins} label="Ardoises CDF" value={currency(summary?.outstanding_credit.cdf ?? 0, "CDF")} detail={currency(summary?.outstanding_credit.usd ?? 0, "USD")} tone="warn" />
          <Metric icon={AlertTriangle} label="Stocks faibles" value={String(summary?.low_stock_count ?? lowStock.length)} detail="produits a verifier" tone={lowStock.length ? "danger" : "ok"} />
          <Metric icon={UsersRound} label="Equipe" value={String(staffQuery.data?.staff.length ?? 0)} detail="comptes actifs" />
          <Metric icon={ChefHat} label="Menu" value={String(menuQuery.data?.items.length ?? 0)} detail="articles disponibles" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel>
            <PanelHeader title="Caisse du service" eyebrow={summary?.current_cash_session ? "Ouverte" : "Fermee"} />
            {summary?.current_cash_session ? <div className="grid gap-px bg-border sm:grid-cols-2"><CashLine label="Fonds + ventes CDF" expected={currency(summary.current_cash_session.expected_balance.cdf, "CDF")} sales={currency(summary.current_cash_session.cash_sales.cdf, "CDF")} /><CashLine label="Fonds + ventes USD" expected={currency(summary.current_cash_session.expected_balance.usd, "USD")} sales={currency(summary.current_cash_session.cash_sales.usd, "USD")} /></div> : <EmptyState title="Aucune caisse ouverte" detail="Le caissier doit ouvrir le service avant un encaissement." />}
          </Panel>

          <Panel>
            <PanelHeader title="Alertes de stock" eyebrow={`${lowStock.length} critiques`} />
            {lowStock.length === 0 ? <EmptyState title="Aucune alerte" /> : <div className="divide-y divide-border">{lowStock.slice(0, 6).map((item) => <div key={item.id} className="flex items-center justify-between px-4 py-4"><div><p className="text-sm font-semibold text-primary">{item.name}</p><p className="text-xs text-text-secondary">{item.quantity} {item.base_unit} disponibles</p></div><StatusPill tone="danger">Seuil {item.alert_quantity}</StatusPill></div>)}</div>}
          </Panel>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <Panel>
            <PanelHeader title="Modules du restaurant" />
            <div className="divide-y divide-border">{(activitiesQuery.data?.activities ?? []).map((activity) => <div key={activity.code} className="flex items-center justify-between px-4 py-3"><span className="text-sm font-medium text-primary">{activity.name}</span><StatusPill tone={activity.enabled ? "ok" : "neutral"}>{activity.enabled ? "Actif" : "Inactif"}</StatusPill></div>)}</div>
          </Panel>
          <Panel>
            <PanelHeader title="Operations sensibles recentes" action={<ShieldCheck className="h-4 w-4 text-success" />} />
            {auditQuery.isError ? <ErrorState detail="Journal reserve au gerant." /> : (auditQuery.data?.entries.length ?? 0) === 0 ? <EmptyState title="Aucune operation journalisee" /> : <div className="divide-y divide-border">{(auditQuery.data?.entries ?? []).map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 px-4 py-3"><div><p className="text-sm font-semibold text-primary">{titleCase(entry.action)}</p><p className="text-xs text-text-secondary">{entry.resource} · {entry.actor_id}</p></div><time className="text-xs text-text-disabled">{new Date(entry.occurred_at).toLocaleTimeString("fr-CD", { hour: "2-digit", minute: "2-digit" })}</time></div>)}</div>}
          </Panel>
        </div>
      </div> : null}
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, tone = "ok" }: { icon: typeof ClipboardList; label: string; value: string; detail: string; tone?: "ok" | "warn" | "danger" }) {
  const toneClass = tone === "danger" ? "text-danger" : tone === "warn" ? "text-warning" : "text-success";
  return <div className="border-t-2 border-border bg-surface px-4 py-5 shadow-line"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase text-text-secondary">{label}</p><Icon className={`h-4 w-4 ${toneClass}`} /></div><p className="mt-4 text-xl font-semibold text-primary">{value}</p><p className="mt-1 text-xs text-text-secondary">{detail}</p></div>;
}

function CashLine({ label, expected, sales }: { label: string; expected: string; sales: string }) {
  return <div className="bg-surface p-5"><p className="text-sm text-text-secondary">{label}</p><p className="mt-3 text-2xl font-semibold text-primary">{expected}</p><p className="mt-1 text-xs font-medium text-success">Ventes especes : {sales}</p></div>;
}
