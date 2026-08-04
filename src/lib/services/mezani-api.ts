import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import {
  clearAuthSession,
  clearStoredAuthSession,
  isAccountSession,
  saveAuthSession,
  updateAuthTokens,
  type AuthState,
} from "@/lib/features/auth-slice";
import type {
  Activity,
  AccountSessionResponse,
  AuditEntry,
  ApiListGradesResponse,
  ApiListActivitiesResponse,
  ApiListMenuResponse,
  ApiListRestaurantsResponse,
  ApiListRolesResponse,
  ApiListStaffResponse,
  AuthenticatedStaffResponse,
  BookingRecord,
  CashSession,
  CreateBookingRequest,
  CreateBookingResponse,
  CreateStaffUserRequest,
  CreateEstablishmentRequest,
  CurrentOrganizationResponse,
  CurrencyCode,
  DailySummary,
  Debt,
  LoginRestaurantStaffRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  OrderStatus,
  OrderStatusEvent,
  OperationalOrder,
  PaymentRequest,
  PaymentResponse,
  LocalCustomer,
  LocalSettings,
  MenuItem,
  Establishment,
  EstablishmentMembership,
  MoneyBalance,
  PaymentTender,
  RegisterRestaurantOwnerRequest,
  Restaurant,
  RestaurantStatus,
  RestaurantType,
  StaffMember,
  Sale,
  StockItem,
  StockMovement,
  SubscriptionCheckout,
  SubscriptionEntitlement,
  SubscriptionPlan,
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

type RegisterRestaurantOwnerArgs = {
  restaurantId: string;
  body: RegisterRestaurantOwnerRequest;
};

type LoginRestaurantStaffArgs = {
  restaurantId: string;
  body: LoginRestaurantStaffRequest;
};

type CreateStaffUserArgs = {
  restaurantId: string;
  body: CreateStaffUserRequest;
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
const authEndpointNames = new Set([
  "loginAccount",
  "registerWithActivationKey",
  "validateActivationKey",
  "listSubscriptionPlans",
  "createSubscriptionCheckout",
  "refreshAccountTokens",
  "loginRestaurantStaff",
  "refreshRestaurantTokens",
  "registerRestaurantOwner",
]);

type AuthAwareState = {
  auth: AuthState;
};

type RefreshRestaurantTokensResponse = {
  tokens: AuthenticatedStaffResponse["tokens"];
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
  prepareHeaders: (headers, { endpoint, getState }) => {
    const session = (getState() as AuthAwareState).auth.session;
    const isAuthEndpoint = authEndpointNames.has(endpoint);

    if (!isAuthEndpoint && session?.tokens.access_token) {
      headers.set("authorization", `Bearer ${session.tokens.access_token}`);
    }

    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const session = (api.getState() as AuthAwareState).auth.session;

  if (
    result.error?.status !== 401 ||
    !session?.tokens.refresh_token ||
    authEndpointNames.has(api.endpoint)
  ) {
    return result;
  }

  const refreshResult = await rawBaseQuery(
    {
      url: isAccountSession(session)
        ? "/api/v1/auth/refresh"
        : "/api/v1/restaurants/auth/refresh",
      method: "POST",
      body: { refresh_token: session.tokens.refresh_token },
    },
    api,
    extraOptions,
  );

  if (refreshResult.data) {
    const { tokens } = refreshResult.data as RefreshRestaurantTokensResponse;
    const nextSession = { ...session, tokens };
    saveAuthSession(nextSession);
    api.dispatch(updateAuthTokens(tokens));
    return rawBaseQuery(args, api, extraOptions);
  }

  clearStoredAuthSession();
  api.dispatch(clearAuthSession());
  return result;
};

export const mezaniApi = createApi({
  reducerPath: "mezaniApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Organization",
    "Subscription",
    "Establishment",
    "EstablishmentMember",
    "Restaurant",
    "Menu",
    "Staff",
    "Roles",
    "Grades",
    "Activities",
    "Bookings",
    "Order",
    "LocalSettings",
    "Cash",
    "Sale",
    "Stock",
    "Debt",
    "Audit",
    "Summary",
  ],
  endpoints: (builder) => ({
    validateActivationKey: builder.mutation<
      { valid: boolean; organization_id?: string; max_establishments?: number; role: string; plan?: SubscriptionPlan },
      { key: string; email?: string; phone?: string }
    >({
      query: (body) => ({ url: "/api/v1/auth/activation/validate", method: "POST", body }),
    }),
    registerWithActivationKey: builder.mutation<
      AccountSessionResponse,
      {
        key: string;
        name: string;
        email?: string;
        phone?: string;
        password: string;
        organization_name?: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/auth/register-with-activation-key",
        method: "POST",
        body,
      }),
    }),
    loginAccount: builder.mutation<
      AccountSessionResponse,
      { identifier: string; password: string }
    >({
      query: (body) => ({ url: "/api/v1/auth/login", method: "POST", body }),
    }),
    refreshAccountTokens: builder.mutation<RefreshRestaurantTokensResponse, string>({
      query: (refreshToken) => ({
        url: "/api/v1/auth/refresh",
        method: "POST",
        body: { refresh_token: refreshToken },
      }),
    }),
    listSubscriptionPlans: builder.query<{ plans: SubscriptionPlan[] }, void>({
      query: () => "/api/v1/subscription-plans",
      providesTags: [{ type: "Subscription", id: "PLANS" }],
    }),
    createSubscriptionCheckout: builder.mutation<
      SubscriptionCheckout,
      { plan_id: string; email?: string; phone?: string; payment_method: string }
    >({
      query: (body) => ({ url: "/api/v1/subscription-checkouts", method: "POST", body }),
    }),
    getCurrentSubscription: builder.query<SubscriptionEntitlement, void>({
      query: () => "/api/v1/subscriptions/current",
      providesTags: [{ type: "Subscription", id: "CURRENT" }],
    }),
    activateSubscription: builder.mutation<SubscriptionEntitlement, { key: string }>({
      query: (body) => ({ url: "/api/v1/subscriptions/activate", method: "POST", body }),
      invalidatesTags: [
        { type: "Subscription", id: "CURRENT" },
        { type: "Organization", id: "CURRENT" },
      ],
    }),
    getCurrentOrganization: builder.query<CurrentOrganizationResponse, void>({
      query: () => "/api/v1/organizations/current",
      providesTags: [{ type: "Organization", id: "CURRENT" }],
    }),
    listEstablishments: builder.query<{ establishments: Establishment[] }, void>({
      query: () => "/api/v1/establishments",
      providesTags: (result) =>
        result
          ? [
              ...result.establishments.map((item) => ({
                type: "Establishment" as const,
                id: item.id,
              })),
              { type: "Establishment", id: "LIST" },
            ]
          : [{ type: "Establishment", id: "LIST" }],
    }),
    createEstablishment: builder.mutation<Establishment, CreateEstablishmentRequest>({
      query: (body) => ({ url: "/api/v1/establishments", method: "POST", body }),
      invalidatesTags: [
        { type: "Establishment", id: "LIST" },
        { type: "Organization", id: "CURRENT" },
      ],
    }),
    getEstablishment: builder.query<Establishment, string>({
      query: (id) => `/api/v1/establishments/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Establishment", id }],
    }),
    updateEstablishment: builder.mutation<
      Establishment,
      { id: string; body: Partial<CreateEstablishmentRequest> }
    >({
      query: ({ id, body }) => ({
        url: `/api/v1/establishments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Establishment", id },
        { type: "Establishment", id: "LIST" },
      ],
    }),
    archiveEstablishment: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/establishments/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Establishment", id },
        { type: "Establishment", id: "LIST" },
        { type: "Organization", id: "CURRENT" },
      ],
    }),
    listEstablishmentMembers: builder.query<
      { members: EstablishmentMembership[] },
      string
    >({
      query: (id) => `/api/v1/establishments/${id}/members`,
      providesTags: (_result, _error, id) => [{ type: "EstablishmentMember", id }],
    }),
    addEstablishmentMember: builder.mutation<
      EstablishmentMembership,
      {
        establishmentId: string;
        body: {
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string;
          role: EstablishmentMembership["role"];
          permissions?: string[];
        };
      }
    >({
      query: ({ establishmentId, body }) => ({
        url: `/api/v1/establishments/${establishmentId}/members`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { establishmentId }) => [
        { type: "EstablishmentMember", id: establishmentId },
        { type: "Establishment", id: establishmentId },
        { type: "Establishment", id: "LIST" },
      ],
    }),
    updateEstablishmentMember: builder.mutation<
      EstablishmentMembership,
      {
        establishmentId: string;
        membershipId: string;
        body: {
          role?: EstablishmentMembership["role"];
          permissions?: string[];
          status?: EstablishmentMembership["status"];
        };
      }
    >({
      query: ({ establishmentId, membershipId, body }) => ({
        url: `/api/v1/establishments/${establishmentId}/members/${membershipId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { establishmentId }) => [
        { type: "EstablishmentMember", id: establishmentId },
        { type: "Establishment", id: establishmentId },
        { type: "Establishment", id: "LIST" },
      ],
    }),
    removeEstablishmentMember: builder.mutation<void, { establishmentId: string; membershipId: string }>({
      query: ({ establishmentId, membershipId }) => ({
        url: `/api/v1/establishments/${establishmentId}/members/${membershipId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { establishmentId }) => [
        { type: "EstablishmentMember", id: establishmentId },
        { type: "Establishment", id: establishmentId },
        { type: "Establishment", id: "LIST" },
      ],
    }),
    registerRestaurantOwner: builder.mutation<AuthenticatedStaffResponse, RegisterRestaurantOwnerArgs>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/auth/register`,
        method: "POST",
        body,
      }),
    }),
    loginRestaurantStaff: builder.mutation<AuthenticatedStaffResponse, LoginRestaurantStaffArgs>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/auth/login`,
        method: "POST",
        body,
      }),
    }),
    refreshRestaurantTokens: builder.mutation<RefreshRestaurantTokensResponse, string>({
      query: (refreshToken) => ({
        url: "/api/v1/restaurants/auth/refresh",
        method: "POST",
        body: { refresh_token: refreshToken },
      }),
    }),
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
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Restaurant", id: restaurantId }],
    }),
    getPublicRestaurant: builder.query<Restaurant, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Restaurant", id: restaurantId }],
    }),
    listRestaurantRoles: builder.query<ApiListRolesResponse, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/roles`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Roles", id: restaurantId }],
    }),
    listRestaurantGrades: builder.query<ApiListGradesResponse, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/grades`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Grades", id: restaurantId }],
    }),
    listRestaurantActivities: builder.query<ApiListActivitiesResponse, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/activities`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Activities", id: restaurantId }],
    }),
    listStaff: builder.query<ApiListStaffResponse, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/staff`,
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
    createRestaurantStaffUser: builder.mutation<AuthenticatedStaffResponse, CreateStaffUserArgs>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/users`,
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
    createMenuItem: builder.mutation<
      MenuItem,
      {
        restaurantId: string;
        body: {
          category_id: string;
          name: string;
          description: string;
          price: number;
          currency: CurrencyCode;
          sale_unit: string;
          allergens: string[];
          photo_url?: string;
        };
      }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/menu/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [{ type: "Menu", id: restaurantId }],
    }),
    setMenuItemAvailability: builder.mutation<
      MenuItem,
      { restaurantId: string; itemId: string; isAvailable: boolean }
    >({
      query: ({ restaurantId, itemId, isAvailable }) => ({
        url: `/api/v1/restaurants/${restaurantId}/menu/items/${itemId}/availability`,
        method: "PATCH",
        body: { is_available: isAvailable },
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [{ type: "Menu", id: restaurantId }],
    }),
    createBooking: builder.mutation<CreateBookingResponse, RestaurantScoped<CreateBookingRequest>>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/table_bookings`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [{ type: "Bookings", id: restaurantId }],
    }),
    listBookings: builder.query<{ bookings: BookingRecord[] }, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/table_bookings`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Bookings", id: restaurantId }],
    }),
    updateBookingStatus: builder.mutation<
      BookingRecord,
      { restaurantId: string; bookingId: string; status: "confirmed" | "seated" | "completed" | "cancelled" }
    >({
      query: ({ restaurantId, bookingId, status }) => ({
        url: `/api/v1/restaurants/${restaurantId}/table_bookings/${bookingId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [{ type: "Bookings", id: restaurantId }],
    }),
    createOrder: builder.mutation<CreateOrderResponse, RestaurantScoped<CreateOrderRequest>>({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/orders`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Order", id: restaurantId },
      ],
    }),
    listOrders: builder.query<{ orders: OperationalOrder[] }, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/orders`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Order", id: restaurantId }],
    }),
    updateOrderStatus: builder.mutation<OrderStatusEvent, UpdateOrderStatusArgs>({
      query: ({ restaurantId, orderId, status, message }) => ({
        url: `/api/v1/restaurants/${restaurantId}/orders/${orderId}/status`,
        method: "PATCH",
        body: { status, message },
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Order", id: restaurantId },
      ],
    }),
    processPayment: builder.mutation<
      PaymentResponse,
      { restaurantId: string; body: PaymentRequest }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/payments/process`,
        method: "POST",
        body,
      }),
    }),
    getLocalSettings: builder.query<LocalSettings, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/local-settings`,
      providesTags: (_result, _error, restaurantId) => [{ type: "LocalSettings", id: restaurantId }],
    }),
    updateLocalSettings: builder.mutation<
      LocalSettings,
      { restaurantId: string; body: Omit<LocalSettings, "restaurant_id" | "updated_at" | "updated_by"> }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/local-settings`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "LocalSettings", id: restaurantId },
        { type: "Summary", id: restaurantId },
      ],
    }),
    getCurrentCashSession: builder.query<CashSession, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/cash-sessions/current`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Cash", id: restaurantId }],
    }),
    listCashSessions: builder.query<{ cash_sessions: CashSession[] }, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/cash-sessions`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Cash", id: restaurantId }],
    }),
    openCashSession: builder.mutation<CashSession, { restaurantId: string; openingBalance: MoneyBalance }>({
      query: ({ restaurantId, openingBalance }) => ({
        url: `/api/v1/restaurants/${restaurantId}/cash-sessions/open`,
        method: "POST",
        body: { opening_balance: openingBalance },
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Cash", id: restaurantId },
        { type: "Summary", id: restaurantId },
        { type: "Audit", id: restaurantId },
      ],
    }),
    closeCashSession: builder.mutation<
      CashSession,
      { restaurantId: string; cashSessionId: string; countedBalance: MoneyBalance; reason: string }
    >({
      query: ({ restaurantId, cashSessionId, countedBalance, reason }) => ({
        url: `/api/v1/restaurants/${restaurantId}/cash-sessions/${cashSessionId}/close`,
        method: "POST",
        body: { counted_balance: countedBalance, reason },
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Cash", id: restaurantId },
        { type: "Summary", id: restaurantId },
        { type: "Audit", id: restaurantId },
      ],
    }),
    listSales: builder.query<{ sales: Sale[] }, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/sales`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Sale", id: restaurantId }],
    }),
    recordSale: builder.mutation<
      { sale: Sale; debt: Debt | null },
      {
        restaurantId: string;
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
      }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/sales`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Sale", id: restaurantId },
        { type: "Debt", id: restaurantId },
        { type: "Cash", id: restaurantId },
        { type: "Summary", id: restaurantId },
        { type: "Audit", id: restaurantId },
      ],
    }),
    listStock: builder.query<{ items: StockItem[]; movements: StockMovement[] }, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/stock`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Stock", id: restaurantId }],
    }),
    createStockItem: builder.mutation<
      StockItem,
      {
        restaurantId: string;
        body: {
          name: string;
          category: string;
          sale_unit: string;
          base_unit: string;
          units_per_sale_unit: number;
          quantity: number;
          alert_quantity: number;
        };
      }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/stock/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Stock", id: restaurantId },
        { type: "Audit", id: restaurantId },
      ],
    }),
    moveStock: builder.mutation<
      StockMovement,
      { restaurantId: string; body: { item_id: string; type: StockMovement["type"]; quantity: number; reason: string } }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/stock/movements`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Stock", id: restaurantId },
        { type: "Summary", id: restaurantId },
        { type: "Audit", id: restaurantId },
      ],
    }),
    listDebts: builder.query<{ debts: Debt[] }, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}/debts`,
      providesTags: (_result, _error, restaurantId) => [{ type: "Debt", id: restaurantId }],
    }),
    createDebt: builder.mutation<
      Debt,
      {
        restaurantId: string;
        body: { order_id?: string; customer: LocalCustomer; currency: CurrencyCode; amount: number; due_date?: string; notes?: string };
      }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/debts`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Debt", id: restaurantId },
        { type: "Summary", id: restaurantId },
        { type: "Audit", id: restaurantId },
      ],
    }),
    payDebt: builder.mutation<
      Debt,
      { restaurantId: string; debtId: string; amount: number; method: string; reference?: string }
    >({
      query: ({ restaurantId, debtId, ...body }) => ({
        url: `/api/v1/restaurants/${restaurantId}/debts/${debtId}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { restaurantId }) => [
        { type: "Debt", id: restaurantId },
        { type: "Summary", id: restaurantId },
        { type: "Audit", id: restaurantId },
      ],
    }),
    listAudit: builder.query<{ entries: AuditEntry[] }, { restaurantId: string; limit?: number }>({
      query: ({ restaurantId, limit = 100 }) => ({
        url: `/api/v1/restaurants/${restaurantId}/audit`,
        params: { limit },
      }),
      providesTags: (_result, _error, { restaurantId }) => [{ type: "Audit", id: restaurantId }],
    }),
    getDailySummary: builder.query<DailySummary, { restaurantId: string; date?: string }>({
      query: ({ restaurantId, date }) => ({
        url: `/api/v1/restaurants/${restaurantId}/daily-summary`,
        params: date ? { date } : undefined,
      }),
      providesTags: (_result, _error, { restaurantId }) => [{ type: "Summary", id: restaurantId }],
    }),
  }),
});

export const {
  useAddEstablishmentMemberMutation,
  useActivateSubscriptionMutation,
  useArchiveEstablishmentMutation,
  useAssignStaffRoleMutation,
  useCloseCashSessionMutation,
  useCreateDebtMutation,
  useCreateEstablishmentMutation,
  useCreateSubscriptionCheckoutMutation,
  useCreateStockItemMutation,
  useCreateRestaurantStaffUserMutation,
  useCreateBookingMutation,
  useCreateMenuItemMutation,
  useCreateOrderMutation,
  useGetAdminRestaurantQuery,
  useGetCurrentOrganizationQuery,
  useGetCurrentSubscriptionQuery,
  useGetEstablishmentQuery,
  useGetCurrentCashSessionQuery,
  useGetDailySummaryQuery,
  useGetLocalSettingsQuery,
  useGetPublicRestaurantQuery,
  useListRestaurantGradesQuery,
  useListAdminRestaurantsQuery,
  useListAuditQuery,
  useListBookingsQuery,
  useListCashSessionsQuery,
  useListDebtsQuery,
  useListEstablishmentMembersQuery,
  useListEstablishmentsQuery,
  useListMenuItemsQuery,
  useListOrdersQuery,
  useListRestaurantActivitiesQuery,
  useListRestaurantRolesQuery,
  useListStaffQuery,
  useListSalesQuery,
  useListStockQuery,
  useListSubscriptionPlansQuery,
  useLoginRestaurantStaffMutation,
  useLoginAccountMutation,
  useProcessPaymentMutation,
  useMoveStockMutation,
  useOpenCashSessionMutation,
  usePayDebtMutation,
  useRecordSaleMutation,
  useRefreshRestaurantTokensMutation,
  useRefreshAccountTokensMutation,
  useRemoveEstablishmentMemberMutation,
  useRegisterWithActivationKeyMutation,
  useRegisterRestaurantOwnerMutation,
  useSetMenuItemAvailabilityMutation,
  useUpdateOrderStatusMutation,
  useUpdateLocalSettingsMutation,
  useUpdateBookingStatusMutation,
  useUpdateEstablishmentMutation,
  useUpdateEstablishmentMemberMutation,
  useValidateActivationKeyMutation,
} = mezaniApi;

export type { Activity };
