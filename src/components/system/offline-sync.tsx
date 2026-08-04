"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  offlineQueueEventName,
  readOfflineQueue,
  removeOfflineOperation,
} from "@/lib/offline-queue";
import { useAppSelector } from "@/lib/hooks";
import { useCreateOrderMutation, useRecordSaleMutation } from "@/lib/services/mezani-api";

export function OfflineSync() {
  const restaurantId = useAppSelector((state) => state.app.selectedRestaurantId);
  const [createOrder] = useCreateOrderMutation();
  const [recordSale] = useRecordSaleMutation();
  const isSyncing = useRef(false);

  const flush = useCallback(async () => {
    if (!restaurantId || !navigator.onLine || isSyncing.current) return;
    isSyncing.current = true;
    try {
      const queue = readOfflineQueue().filter((entry) => entry.restaurantId === restaurantId);
      for (const operation of queue) {
        try {
          if (operation.kind === "create_order") {
            await createOrder({ restaurantId, body: operation.body }).unwrap();
          } else {
            await recordSale({ restaurantId, body: operation.body }).unwrap();
          }
          removeOfflineOperation(operation.id);
        } catch {
          break;
        }
      }
    } finally {
      isSyncing.current = false;
    }
  }, [createOrder, recordSale, restaurantId]);

  useEffect(() => {
    void flush();
    const onOnline = () => void flush();
    const onQueueChange = () => void flush();
    window.addEventListener("online", onOnline);
    window.addEventListener(offlineQueueEventName(), onQueueChange);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener(offlineQueueEventName(), onQueueChange);
    };
  }, [flush]);

  return null;
}
