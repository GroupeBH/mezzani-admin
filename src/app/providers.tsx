"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import {
  finishAuthHydration,
  isAccountSession,
  readStoredAuthSession,
  setAuthSession,
} from "@/lib/features/auth-slice";
import { setSelectedRestaurantId } from "@/lib/features/app-slice";
import { useAppDispatch } from "@/lib/hooks";
import { store } from "@/lib/store";
import { OfflineSync } from "@/components/system/offline-sync";
import { PwaRegistrar } from "@/components/system/pwa-registrar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthHydrator />
      <OfflineSync />
      <PwaRegistrar />
      {children}
    </Provider>
  );
}

function AuthHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const session = readStoredAuthSession();
    if (session) {
      dispatch(setAuthSession(session));
      if (!isAccountSession(session)) {
        dispatch(setSelectedRestaurantId(session.staff.restaurant_id));
      } else {
        dispatch(
          setSelectedRestaurantId(
            window.localStorage.getItem("mezani.active-establishment.v1"),
          ),
        );
      }
      return;
    }

    dispatch(finishAuthHydration());
  }, [dispatch]);

  return null;
}
