import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Activity,
  ApiListActivitiesResponse,
  ApiListMenuResponse,
  ApiListRestaurantsResponse,
  ApiListRolesResponse,
  ApiListStaffResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatus,
  OrderStatusEvent,
  PaymentRequest,
  PaymentResponse,
  Restaurant,
  RestaurantStatus,
  RestaurantType,
  StaffMember,
} from "@/lib/types";

type ListRestaurantsArgs = {
  status?: RestaurantStatus | "";
  type?: RestaurantType | "";
  search?: string;
};

type AssignStaffArgs = {
  restaurantId: string;
  body: {
    user_id: string;
    role_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
};

type UpdateOrderStatusArgs = {
  restaurantId: string;
  orderId: string;
  status: OrderStatus;
  message?: string;
};

type RestaurantScoped<T> = {
  restaurantId: string;
  body: T;
};

function cleanParams(params: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value));
}

const baseUrl = process.env.NEXT_PUBLIC_RESTO_API_BASE_PATH ?? "/api/resto";

export const mezaniApi = createApi({
  reducerPath: "mezaniApi",
  baseQuery: fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers) => {
      const adminToken = process.env.NEXT_PUBLIC_MEZANI_ADMIN_TOKEN;
      const apiKey = process.env.NEXT_PUBLIC_MEZANI_API_KEY;

      if (adminToken) {
        headers.set("authorization", `Bearer ${adminToken}`);
      }

      if (apiKey) {
        headers.set("x-api-key", apiKey);
      }

      return headers;
    },
  }),
  tagTypes: ["Restaurant", "Menu", "Staff", "Roles", "Activities", "Order"],
  endpoints: (builder) => ({
    listAdminRestaurants: builder.query<ApiListRestaurantsResponse, ListRestaurantsArgs | void>({
      query: (filters) => ({
        url: "/api/v1/admin/restaurants",
        params: cleanParams({
          status: filters?.status || undefined,
          type: filters?.type || undefined,
          search: filters?.search?.trim() || undefined,
        }),
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.restaurants.map((restaurant) => ({
                type: "Restaurant" as const,
                id: restaurant.id,
              })),
              { type: "Restaurant", id: "LIST" },
            ]
          : [{ type: "Restaurant", id: "LIST" }],
    }),
    getAdminRestaurant: builder.query<Restaurant, string>({
      query: (restaurantId) => `/api/v1/admin/restaurants/${restaurantId}`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Restaurant", id: restaurantId }],
    }),
    listRestaurantRoles: builder.query<ApiListRolesResponse, string>({
      query: (restaurantId) => `/api/v1/admin/restaurants/${restaurantId}/roles`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Roles", id: restaurantId }],
    }),
    listRestaurantActivities: builder.query<ApiListActivitiesResponse, string>({
      query: (restaurantId) => `/api/v1/admin/restaurants/${restaurantId}/activities`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Activities", id: restaurantId }],
    }),
    listStaff: builder.query<ApiListStaffResponse, string>({
      query: (restaurantId) => `/api/v1/admin/restaurants/${restaurantId}/staff`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Staff", id: restaurantId }],
    }),
    assignStaffRole: builder.mutation<StaffMember, AssignStaffArgs>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/staff`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [{ type: "Staff", id: restaurantId }],
    }),
    listMenuItems: builder.query<ApiListMenuResponse, { restaurantId: string; categoryId?: string }>({
      query: ({ restaurantId, categoryId }) => ({
        url: `/api/v1/restaurants/${restaurantId}/menu`,
        params: cleanParams({ category_id: categoryId }),
      }),
      providesTags: (_result, _error, { restaurantId }) => [{ type: "Menu", id: restaurantId }],
    }),
    createBooking: builder.mutation<CreateBookingResponse, RestaurantScoped<CreateBookingRequest>>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/table_bookings`,
        method: "POST",
        body,
      }),
    }),
    createOrder: builder.mutation<CreateOrderResponse, RestaurantScoped<CreateOrderRequest>>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/orders`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation<OrderStatusEvent, UpdateOrderStatusArgs>({
      query: ({ restaurantId, orderId, status, message }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/orders/${orderId}/status`,
        method: "PATCH",
        body: { status, message },
      }),
      invalidatesTags: ["Order"],
    }),
    processPayment: builder.mutation<PaymentResponse, PaymentRequest>({
      query: (body) => ({
        url: "/api/v1/payments/process",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useAssignStaffRoleMutation,
  useCreateBookingMutation,
  useCreateOrderMutation,
  useGetAdminRestaurantQuery,
  useListAdminRestaurantsQuery,
  useListMenuItemsQuery,
  useListRestaurantActivitiesQuery,
  useListRestaurantRolesQuery,
  useListStaffQuery,
  useProcessPaymentMutation,
  useUpdateOrderStatusMutation,
} = mezaniApi;

export type { Activity };
