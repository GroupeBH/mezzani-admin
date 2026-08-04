export type RestaurantStatus = "draft" | "active" | "suspended";
export type RestaurantType = "restaurant" | "bar" | "club" | "other";

export type EstablishmentType =
  | "RESTAURANT"
  | "BAR"
  | "MAQUIS"
  | "LOUNGE"
  | "TERRACE"
  | "FAST_FOOD"
  | "CAFE"
  | "OTHER";

export type AccountUser = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  username?: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED";
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  max_establishments: number | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  price_amount_minor: number;
  currency: CurrencyCode;
  billing_period_months: number;
  max_establishments: number;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  updated_at: string;
};

export type SubscriptionEntitlement = {
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUPERSEDED" | "LEGACY";
  max_establishments: number | null;
  expires_at?: string;
  plan?: SubscriptionPlan;
};

export type SubscriptionCheckout = {
  id: string;
  plan_id: string;
  payment_method: string;
  amount_minor: number;
  currency: CurrencyCode;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  paid_at?: string;
  created_at: string;
  plan: SubscriptionPlan;
};

export type OrganizationMembership = {
  id: string;
  user_id: string;
  organization_id: string;
  role: "OWNER" | "MANAGER" | "MEMBER";
  permissions: string[];
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
};

export type Establishment = {
  id: string;
  organization_id: string;
  name: string;
  type: EstablishmentType;
  slug: string;
  phone?: string;
  email?: string;
  address?: string;
  commune?: string;
  district?: string;
  city: string;
  country: string;
  logo_url?: string;
  primary_currency: CurrencyCode;
  accepted_currencies: CurrencyCode[];
  exchange_rate?: number;
  timezone: string;
  payment_methods: string[];
  operational_features: string[];
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role?: EstablishmentRole;
  permissions?: string[];
  created_at: string;
  updated_at: string;
};

export type EstablishmentRole =
  | "OWNER"
  | "MANAGER"
  | "CASHIER"
  | "WAITER"
  | "BARTENDER"
  | "KITCHEN"
  | "STOREKEEPER"
  | "ACCOUNTANT";

export type EstablishmentMembership = {
  id: string;
  user_id: string;
  establishment_id: string;
  role: EstablishmentRole;
  permissions: string[];
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  user: AccountUser;
  created_at: string;
  updated_at: string;
};

export type Restaurant = {
  id: string;
  owner_id?: string;
  name: string;
  slug: string;
  type: RestaurantType;
  description: string;
  address: {
    line1: string;
    city: string;
    country: string;
    postal_code?: string;
  };
  contact: {
    email: string;
    phone: string;
  };
  status: RestaurantStatus;
};

export type Role = {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
};

export type Activity = {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type StaffMember = {
  id: string;
  restaurant_id: string;
  user_id: string;
  role_id: string;
  grade_id?: string;
  first_name: string;
  last_name: string;
  position?: string;
  email?: string;
  username?: string;
  phone: string;
  status: string;
};

export type Grade = {
  id: string;
  restaurant_id: string;
  code: string;
  name: string;
  description: string;
  sort_order: number;
  is_system: boolean;
};

export type RestaurantTokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  access_token_expires_in: number;
  refresh_token_expires_in: number;
};

export type AuthenticatedStaffResponse = {
  staff: StaffMember;
  tokens: RestaurantTokenPair;
};

export type AccountSessionResponse = {
  user: AccountUser;
  organization: Organization;
  organization_membership: OrganizationMembership;
  tokens: RestaurantTokenPair;
};

export type CurrentOrganizationResponse = {
  organization: Organization;
  membership: OrganizationMembership;
  can_create_establishment: boolean;
  establishment_count: number;
  subscription: SubscriptionEntitlement;
};

export type CreateEstablishmentRequest = {
  name: string;
  type: EstablishmentType;
  slug?: string;
  phone?: string;
  email?: string;
  address?: string;
  commune?: string;
  district?: string;
  city: string;
  country: string;
  logo_url?: string;
  primary_currency: CurrencyCode;
  accepted_currencies: CurrencyCode[];
  exchange_rate?: number;
  timezone: string;
  payment_methods: string[];
  operational_features: string[];
};

export type RegisterRestaurantOwnerRequest = {
  code: string;
  email: string;
  username: string;
  phone: string;
  password: string;
};

export type LoginRestaurantStaffRequest = {
  phone: string;
  password: string;
};

export type CreateStaffUserRequest = {
  role_id: string;
  grade_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  username?: string;
  phone: string;
  password: string;
};

export type MenuItem = {
  item_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  sale_unit: string;
  allergens: string[];
  is_available: boolean;
  photo_url?: string;
};

export type GuestDetails = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
};

export type OrderType = "delivery" | "pickup" | "table_order";

export type CreateOrderRequest = {
  items: Array<{
    item_id: string;
    quantity: number;
    note?: string;
  }>;
  order_type: OrderType;
  delivery_address?: string;
  table_number?: string;
  guest_details: GuestDetails;
  client_order_id?: string;
};

export type CreateOrderResponse = {
  order_id: string;
  status: string;
  total_amount: number;
};

export type CreateBookingRequest = {
  date: string;
  time: string;
  table_number?: string;
  number_of_guests: number;
  guest_details: GuestDetails;
};

export type CreateBookingResponse = {
  booking_id: string;
  status: string;
  message: string;
};

export type BookingRecord = CreateBookingResponse & {
  restaurant_id: string;
  date: string;
  time: string;
  table_number?: string;
  number_of_guests: number;
  guest_name: string;
  guest_phone: string;
  created_at: string;
};

export type PaymentRequest = {
  order_id?: string;
  booking_id?: string;
  amount: number;
  payment_method: string;
  transaction_details?: Record<string, unknown>;
};

export type PaymentResponse = {
  transaction_id: string;
  status: string;
  message: string;
};

export type CurrencyCode = "CDF" | "USD";

export type LocalSettings = {
  restaurant_id: string;
  commune: string;
  quarter: string;
  timezone: string;
  primary_currency: CurrencyCode;
  accepted_currencies: CurrencyCode[];
  cdf_per_usd: number;
  payment_methods: string[];
  mobile_money_providers: string[];
  updated_at: string;
  updated_by: string;
};

export type MoneyBalance = {
  cdf: number;
  usd: number;
};

export type CashSession = {
  id: string;
  restaurant_id: string;
  status: "open" | "closed";
  opening_balance: MoneyBalance;
  cash_sales: MoneyBalance;
  expected_balance: MoneyBalance;
  counted_balance?: MoneyBalance;
  variance?: MoneyBalance;
  opened_by: string;
  closed_by?: string;
  opened_at: string;
  closed_at?: string;
};

export type PaymentTender = {
  method: "cash" | "mobile_money" | "card" | "bank_transfer";
  currency: CurrencyCode;
  amount: number;
  provider?: string;
  reference?: string;
};

export type LocalCustomer = {
  name: string;
  phone: string;
};

export type Sale = {
  id: string;
  restaurant_id: string;
  cash_session_id: string;
  order_id: string;
  idempotency_key: string;
  total_amount: number;
  total_currency: CurrencyCode;
  cdf_per_usd: number;
  tenders: PaymentTender[];
  paid_amount: number;
  credit_amount: number;
  change_amount: number;
  payment_status: "paid" | "partial_credit";
  customer?: LocalCustomer;
  created_by: string;
  created_at: string;
};

export type DebtPayment = {
  id: string;
  amount: number;
  method: string;
  reference?: string;
  created_by: string;
  created_at: string;
};

export type Debt = {
  id: string;
  restaurant_id: string;
  sale_id?: string;
  order_id?: string;
  customer: LocalCustomer;
  currency: CurrencyCode;
  original_amount: number;
  paid_amount: number;
  balance: number;
  status: "open" | "paid";
  due_date?: string;
  notes?: string;
  payments: DebtPayment[];
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type StockItem = {
  id: string;
  restaurant_id: string;
  name: string;
  category: string;
  sale_unit: string;
  base_unit: string;
  units_per_sale_unit: number;
  quantity: number;
  alert_quantity: number;
  updated_at: string;
};

export type StockMovement = {
  id: string;
  restaurant_id: string;
  item_id: string;
  type: "entry" | "exit" | "loss" | "breakage" | "correction";
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_by: string;
  created_at: string;
};

export type AuditEntry = {
  id: string;
  restaurant_id: string;
  actor_id: string;
  action: string;
  resource: string;
  resource_id: string;
  reason?: string;
  details?: Record<string, unknown>;
  occurred_at: string;
};

export type DailySummary = {
  date: string;
  sales_count: number;
  sales: MoneyBalance;
  cash_sales: MoneyBalance;
  outstanding_credit: MoneyBalance;
  low_stock_count: number;
  current_cash_session?: CashSession;
};

export type OrderStatus =
  | "pending_payment"
  | "received"
  | "confirmed"
  | "preparing"
  | "ready"
  | "in_delivery"
  | "delivered"
  | "served"
  | "cancelled";

export type OrderStatusEvent = {
  type: string;
  restaurant_id: string;
  order_id: string;
  status: OrderStatus;
  message: string;
  occurred_at: string;
};

export type OperationalOrder = {
  order_id: string;
  restaurant_id: string;
  client_order_id?: string;
  status: OrderStatus;
  total_amount: number;
  order_type: OrderType;
  delivery_address?: string;
  table_number?: string;
  items: Array<{ item_id: string; quantity: number; note?: string }>;
  guest_name: string;
  guest_phone: string;
  created_at: string;
  updated_at: string;
};

export type ApiListRestaurantsResponse = {
  restaurants: Restaurant[];
};

export type ApiListRolesResponse = {
  roles: Role[];
};

export type ApiListActivitiesResponse = {
  activities: Activity[];
};

export type ApiListStaffResponse = {
  staff: StaffMember[];
};

export type ApiListGradesResponse = {
  grades: Grade[];
};

export type ApiListMenuResponse = {
  restaurant_id: string;
  items: MenuItem[];
};
