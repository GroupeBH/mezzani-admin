"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Flame, RefreshCw, XCircle } from "lucide-react";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useListMenuItemsQuery, useListOrdersQuery, useUpdateOrderStatusMutation } from "@/lib/services/mezani-api";
import type { OperationalOrder, OrderStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

const columns: Array<{ id: OrderStatus; label: string }> = [
  { id: "received", label: "Recues" },
  { id: "preparing", label: "En preparation" },
  { id: "ready", label: "Pretes" },
  { id: "served", label: "Servies" },
];

export default function OperationsPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const ordersQuery = useListOrdersQuery(restaurantId, { skip: !restaurantId, pollingInterval: 8000, skipPollingIfUnfocused: true });
  const menuQuery = useListMenuItemsQuery({ restaurantId }, { skip: !restaurantId });
  const [updateStatus, updateState] = useUpdateOrderStatusMutation();
  const [message, setMessage] = useState<string | null>(null);
  const orders = ordersQuery.data?.orders ?? [];
  const itemNames = useMemo(() => new Map((menuQuery.data?.items ?? []).map((item) => [item.item_id, item.name])), [menuQuery.data?.items]);
  const totals = useMemo(() => ({ waiting: orders.filter((order) => normalizedStatus(order.status) === "received").length, cooking: orders.filter((order) => order.status === "preparing").length, ready: orders.filter((order) => order.status === "ready").length, cancelled: orders.filter((order) => order.status === "cancelled").length }), [orders]);

  async function moveOrder(order: OperationalOrder, status: OrderStatus) {
    setMessage(null);
    try { await updateStatus({ restaurantId, orderId: order.order_id, status, message: `${order.table_number || order.order_id} : ${status}` }).unwrap(); setMessage("Statut synchronise pour la salle et la cuisine."); }
    catch { setMessage("Changement refuse : verifiez votre role et l'ordre des etapes."); }
  }

  return (
    <div>
      <PageHeading eyebrow="Cuisine et bar" title="Commandes en cours" action={<Button onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isFetching}><RefreshCw className={`h-4 w-4 ${ordersQuery.isFetching ? "animate-spin" : ""}`} />Actualiser</Button>}>
        Les tickets proviennent maintenant de l'API et sont rafraichis automatiquement pendant le service.
      </PageHeading>
      {message ? <div className="mb-5 rounded-lg border border-info/20 bg-info-light px-4 py-3 text-sm font-medium text-info">{message}</div> : null}
      {ordersQuery.isLoading ? <LoadingState label="Chargement des commandes" /> : null}
      {ordersQuery.isError ? <ErrorState detail="Les commandes ne sont pas accessibles pour ce role." /> : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="En attente" value={totals.waiting} icon={Clock3} />
        <MiniStat label="En cuisine" value={totals.cooking} icon={Flame} />
        <MiniStat label="Pretes" value={totals.ready} icon={CheckCircle2} />
        <MiniStat label="Annulees" value={totals.cancelled} icon={XCircle} />
      </div>

      {orders.length === 0 && !ordersQuery.isLoading ? <EmptyState title="Aucune commande en cours" detail="Les commandes du POS apparaitront ici." /> : null}
      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => {
          const columnOrders = orders.filter((order) => normalizedStatus(order.status) === column.id);
          return <Panel key={column.id} className="min-h-[480px]"><PanelHeader title={column.label} eyebrow={`${columnOrders.length} tickets`} /><div className="space-y-3 p-3">{columnOrders.map((order) => <article key={order.order_id} className="border-l-4 border-info bg-surface px-4 py-4 shadow-line"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-primary">{order.table_number || order.guest_name || "Comptoir"}</p><p className="mt-1 font-mono text-xs text-text-disabled">{order.order_id}</p></div><StatusPill tone={ageMinutes(order.created_at) > 18 ? "danger" : ageMinutes(order.created_at) > 10 ? "warn" : "ok"}>{ageMinutes(order.created_at)} min</StatusPill></div><div className="mt-4 space-y-2">{order.items.map((item, index) => <div key={`${item.item_id}-${index}`}><p className="text-sm font-medium text-primary">{item.quantity} × {itemNames.get(item.item_id) ?? item.item_id}</p>{item.note ? <p className="text-xs font-medium text-warning">Note : {item.note}</p> : null}</div>)}</div><div className="mt-4 flex items-center justify-end border-t border-border pt-3"><div className="flex gap-1">{nextStatuses(column.id).map((status) => <Button key={status} className="h-8 px-2 text-xs" disabled={updateState.isLoading} onClick={() => moveOrder(order, status)}>{statusLabel(status)}</Button>)}</div></div></article>)}</div></Panel>;
        })}
      </div>
    </div>
  );
}

function normalizedStatus(status: OrderStatus): OrderStatus { return status === "confirmed" || status === "pending_payment" ? "received" : status; }
function nextStatuses(status: OrderStatus): OrderStatus[] { if (status === "received") return ["preparing", "cancelled"]; if (status === "preparing") return ["ready", "cancelled"]; if (status === "ready") return ["served"]; return []; }
function statusLabel(status: OrderStatus) { return ({ preparing: "Preparer", ready: "Pret", served: "Servir", cancelled: "Annuler" } as Partial<Record<OrderStatus, string>>)[status] ?? status; }
function ageMinutes(createdAt: string) { return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)); }
function MiniStat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Clock3 }) { return <div className="border-t-2 border-border bg-surface p-5 shadow-line"><div className="flex items-center justify-between"><p className="text-sm text-text-secondary">{label}</p><Icon className="h-4 w-4 text-info" /></div><p className="mt-3 text-2xl font-semibold text-primary">{value}</p></div>; }
