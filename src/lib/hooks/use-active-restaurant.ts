"use client";

import { useEffect, useMemo } from "react";
import { setSelectedRestaurantId } from "@/lib/features/app-slice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useListAdminRestaurantsQuery } from "@/lib/services/mezani-api";

export function useActiveRestaurant() {
  const dispatch = useAppDispatch();
  const selectedRestaurantId = useAppSelector((state) => state.app.selectedRestaurantId);
  const restaurantsQuery = useListAdminRestaurantsQuery({});
  const restaurants = useMemo(
    () => restaurantsQuery.data?.restaurants ?? [],
    [restaurantsQuery.data?.restaurants],
  );

  const restaurant = useMemo(() => {
    return (
      restaurants.find((entry) => entry.id === selectedRestaurantId) ??
      restaurants[0] ??
      null
    );
  }, [restaurants, selectedRestaurantId]);

  useEffect(() => {
    if (!selectedRestaurantId && restaurant?.id) {
      dispatch(setSelectedRestaurantId(restaurant.id));
    }
  }, [dispatch, restaurant?.id, selectedRestaurantId]);

  return {
    restaurant,
    restaurants,
    selectedRestaurantId: restaurant?.id ?? selectedRestaurantId,
    restaurantsQuery,
  };
}
