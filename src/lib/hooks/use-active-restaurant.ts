"use client";

import { useCallback, useEffect, useMemo } from "react";
import { setSelectedRestaurantId } from "@/lib/features/app-slice";
import { isAccountSession } from "@/lib/features/auth-slice";
import { clearCart } from "@/lib/features/pos-slice";
import {
  canCreateEstablishment as canCreateFromContext,
  resolveActiveEstablishmentId,
  scopedInvalidationTags,
} from "@/lib/establishment-context";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import {
  mezaniApi,
  useGetCurrentOrganizationQuery,
  useGetPublicRestaurantQuery,
  useListEstablishmentsQuery,
} from "@/lib/services/mezani-api";
import type { Establishment, Restaurant } from "@/lib/types";

const activeEstablishmentStorageKey = "mezani.active-establishment.v1";

export function useActiveRestaurant() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.auth.session);
  const selectedEstablishmentId = useAppSelector((state) => state.app.selectedRestaurantId);
  const accountSession = session && isAccountSession(session) ? session : null;
  const legacyRestaurantId = session && !isAccountSession(session) ? session.staff.restaurant_id : null;

  const establishmentsQuery = useListEstablishmentsQuery(undefined, { skip: !accountSession });
  const organizationQuery = useGetCurrentOrganizationQuery(undefined, { skip: !accountSession });
  const legacyRestaurantQuery = useGetPublicRestaurantQuery(legacyRestaurantId ?? "", {
    skip: !legacyRestaurantId,
  });

  const establishments = useMemo<Establishment[]>(() => {
    if (accountSession) {
      return establishmentsQuery.data?.establishments ?? [];
    }
    if (!legacyRestaurantQuery.data) {
      return [];
    }
    return [legacyToEstablishment(legacyRestaurantQuery.data)];
  }, [accountSession, establishmentsQuery.data?.establishments, legacyRestaurantQuery.data]);

  const activeEstablishment = useMemo(
    () =>
      establishments.find((item) => item.id === selectedEstablishmentId) ??
      establishments[0] ??
      null,
    [establishments, selectedEstablishmentId],
  );

  const setActiveEstablishment = useCallback(
    (id: string) => {
      const previousId = selectedEstablishmentId;
      dispatch(setSelectedRestaurantId(id));
      dispatch(clearCart());
      if (typeof window !== "undefined") {
        window.localStorage.setItem(activeEstablishmentStorageKey, id);
      }
      if (previousId && previousId !== id) {
        dispatch(mezaniApi.util.invalidateTags(scopedInvalidationTags(previousId)));
      }
    },
    [dispatch, selectedEstablishmentId],
  );

  useEffect(() => {
    if (!accountSession || selectedEstablishmentId) {
      return;
    }
    const stored = window.localStorage.getItem(activeEstablishmentStorageKey);
    if (stored) {
      dispatch(setSelectedRestaurantId(stored));
    }
  }, [accountSession, dispatch, selectedEstablishmentId]);

  useEffect(() => {
    const resolvedId = resolveActiveEstablishmentId(
      establishments.map((item) => item.id),
      selectedEstablishmentId,
    );
    if (!resolvedId) {
      if (selectedEstablishmentId) {
        dispatch(setSelectedRestaurantId(null));
      }
      return;
    }
    if (selectedEstablishmentId !== resolvedId) {
      setActiveEstablishment(resolvedId);
    }
  }, [dispatch, establishments, selectedEstablishmentId, setActiveEstablishment]);

  const restaurant = useMemo(
    () => (activeEstablishment ? establishmentToLegacy(activeEstablishment) : null),
    [activeEstablishment],
  );
  const restaurants = useMemo(
    () => establishments.map(establishmentToLegacy),
    [establishments],
  );

  return {
    establishments,
    organization: organizationQuery.data?.organization ?? null,
    organizationMembership: organizationQuery.data?.membership ?? null,
    subscription: organizationQuery.data?.subscription ?? null,
    establishmentCount: organizationQuery.data?.establishment_count ?? establishments.length,
    activeEstablishment,
    activeEstablishmentId: activeEstablishment?.id ?? null,
    setActiveEstablishment,
    canCreateEstablishment: organizationQuery.data
      ? organizationQuery.data.can_create_establishment &&
        canCreateFromContext({
          organizationStatus: organizationQuery.data.organization.status,
          subscriptionStatus: organizationQuery.data.subscription.status,
          permissions: organizationQuery.data.membership.permissions,
          establishmentCount: organizationQuery.data.establishment_count,
          maxEstablishments: organizationQuery.data.subscription.max_establishments,
        })
      : false,
    isLoading:
      establishmentsQuery.isLoading || organizationQuery.isLoading || legacyRestaurantQuery.isLoading,
    restaurant,
    restaurants,
    selectedRestaurantId: activeEstablishment?.id ?? null,
    restaurantsQuery: accountSession ? establishmentsQuery : legacyRestaurantQuery,
  };
}

function legacyToEstablishment(restaurant: Restaurant): Establishment {
  return {
    id: restaurant.id,
    organization_id: "legacy",
    name: restaurant.name,
    type: restaurant.type === "bar" ? "BAR" : restaurant.type === "other" ? "OTHER" : "RESTAURANT",
    slug: restaurant.slug,
    phone: restaurant.contact.phone,
    email: restaurant.contact.email,
    address: restaurant.address.line1,
    city: restaurant.address.city,
    country: restaurant.address.country,
    primary_currency: "CDF",
    accepted_currencies: ["CDF"],
    timezone: "Africa/Kinshasa",
    payment_methods: [],
    operational_features: [],
    status: restaurant.status === "suspended" ? "SUSPENDED" : "ACTIVE",
    role: "OWNER",
    permissions: ["establishment:read"],
    created_at: "",
    updated_at: "",
  };
}

function establishmentToLegacy(establishment: Establishment): Restaurant {
  return {
    id: establishment.id,
    name: establishment.name,
    slug: establishment.slug,
    type: establishment.type === "BAR" ? "bar" : establishment.type === "OTHER" ? "other" : "restaurant",
    description: "",
    address: {
      line1: establishment.address ?? "",
      city: establishment.city,
      country: establishment.country,
    },
    contact: {
      email: establishment.email ?? "",
      phone: establishment.phone ?? "",
    },
    status:
      establishment.status === "SUSPENDED"
        ? "suspended"
        : establishment.status === "INACTIVE"
          ? "draft"
          : "active",
  };
}
