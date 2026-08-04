import type { CreateOrderRequest, CurrencyCode, LocalCustomer, PaymentTender } from "@/lib/types";

const storageKey = "mezani.offline.operations.v1";
const changeEvent = "mezani:offline-queue-change";

export type OfflineOperation =
  | {
      id: string;
      kind: "create_order";
      restaurantId: string;
      createdAt: string;
      body: CreateOrderRequest;
    }
  | {
      id: string;
      kind: "record_sale";
      restaurantId: string;
      createdAt: string;
      body: {
        cash_session_id: string;
        order_id: string;
        idempotency_key: string;
        total_amount: number;
        total_currency: CurrencyCode;
        cdf_per_usd: number;
        tenders: PaymentTender[];
        customer?: LocalCustomer;
        due_date?: string;
        notes?: string;
      };
    };

export function readOfflineQueue(): OfflineOperation[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsed) ? (parsed as OfflineOperation[]) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineOperation(operation: OfflineOperation) {
  const queue = readOfflineQueue();
  if (!queue.some((entry) => entry.id === operation.id)) {
    queue.push(operation);
  }
  writeOfflineQueue(queue);
}

export function removeOfflineOperation(id: string) {
  writeOfflineQueue(readOfflineQueue().filter((entry) => entry.id !== id));
}

export function offlineQueueEventName() {
  return changeEvent;
}

function writeOfflineQueue(queue: OfflineOperation[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: { pending: queue.length } }));
}
