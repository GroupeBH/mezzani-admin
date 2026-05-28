"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Flame, RefreshCw } from "lucide-react";
import { kitchenOrders, statusColumns } from "@/lib/data/mock";
import { useActiveRestaurant } from "@/lib/hooks/use-active-restaurant";
import { useUpdateOrderStatusMutation } from "@/lib/services/mezani-api";
import type { OrderStatus } from "@/lib/types";
import { currency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function OperationsPage() {
  const { restaurant } = useActiveRestaurant();
  const restaurantId = restaurant?.id ?? "";
  const [orders, setOrders] = useState(kitchenOrders);
  const [message, setMessage] = useState<string | null>(null);
  const [updateStatus, updateState] = useUpdateOrderStatusMutation();

  const totals = useMemo(() => {
    return {
      waiting: orders.filter((order) => order.status === "received").length,
      cooking: orders.filter((order) => order.status === "preparing").length,
      ready: orders.filter((order) => order.status === "ready").length,
      amount: orders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

  async function moveOrder(orderId: string, status: OrderStatus) {
    setMessage(null);
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));

    if (!restaurantId) {
      return;
    }

    try {
      await updateStatus({
        restaurantId,
        orderId,
        status,
        message: `Commande ${status}`,
      }).unwrap();
      setMessage("Statut publie sur l'API realtime.");
    } catch {
      setMessage("Statut applique localement. Le backend realtime n'a pas confirme.");
    }
  }

  return (
    <div>
      <PageHeading
        eyebrow="Cuisine et salle"
        title="Commandes en cours"
        action={
          <Button>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Rafraichir
          </Button>
        }
      >
        Vue Kanban pour passer les commandes de la reception a la preparation, puis au service.
      </PageHeading>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="En attente" value={totals.waiting} icon={Clock3} />
        <MiniStat label="En cuisine" value={totals.cooking} icon={Flame} />
        <MiniStat label="Pretes" value={totals.ready} icon={CheckCircle2} />
        <MiniStat label="Encours total" value={currency(totals.amount)} icon={RefreshCw} />
      </div>

      {message ? (
        <div className="mb-5 rounded-lg border border-ink/10 bg-white/72 px-4 py-3 text-sm font-medium text-ink/65">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        {statusColumns.map((column) => (
          <Panel key={column.id} className="min-h-[520px]">
            <PanelHeader title={column.label} eyebrow={`${orders.filter((order) => order.status === column.id).length} tickets`} />
            <div className="space-y-3 p-3">
              {orders
                .filter((order) => order.status === column.id)
                .map((order) => (
                  <article key={order.id} className="rounded-lg border border-ink/10 bg-white p-4 shadow-line">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">{order.id}</p>
                        <p className="mt-1 text-xs text-ink/52">{order.table}</p>
                      </div>
                      <StatusPill tone={order.minutes > 18 ? "danger" : order.minutes > 10 ? "warn" : "ok"}>
                        {order.minutes} min
                      </StatusPill>
                    </div>
                    <div className="mt-4 space-y-1">
                      {order.items.map((item) => (
                        <p key={item} className="text-sm text-ink/68">
                          {item}
                        </p>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-ink/8 pt-3">
                      <p className="text-sm font-semibold text-ink">{currency(order.total)}</p>
                      <div className="flex gap-1">
                        {nextStatuses(column.id).map((status) => (
                          <Button
                            key={status}
                            className="h-8 px-2 text-xs"
                            type="button"
                            disabled={updateState.isLoading}
                            onClick={() => moveOrder(order.id, status)}
                          >
                            {statusLabel(status)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function nextStatuses(status: OrderStatus): OrderStatus[] {
  if (status === "received") return ["preparing", "cancelled"];
  if (status === "preparing") return ["ready", "cancelled"];
  if (status === "ready") return ["served"];
  return [];
}

function statusLabel(status: OrderStatus) {
  const labels: Partial<Record<OrderStatus, string>> = {
    preparing: "Prep",
    ready: "Pret",
    served: "Servir",
    cancelled: "Annuler",
  };
  return labels[status] ?? status;
}

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white/72 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/58">{label}</p>
        <Icon className="h-4 w-4 text-basil" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
