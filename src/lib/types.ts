export type RestaurantStatus = "draft" | "active" | "suspended";
export type RestaurantType = "restaurant" | "bar" | "club" | "other";

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
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
};

export type MenuItem = {
  item_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
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
  }>;
  order_type: OrderType;
  delivery_address?: string;
  table_number?: string;
  guest_details: GuestDetails;
};

export type CreateOrderResponse = {
  order_id: string;
  status: string;
  total_amount: number;
};

export type CreateBookingRequest = {
  date: string;
  time: string;
  number_of_guests: number;
  guest_details: GuestDetails;
};

export type CreateBookingResponse = {
  booking_id: string;
  status: string;
  message: string;
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

export type ApiListMenuResponse = {
  restaurant_id: string;
  items: MenuItem[];
};
