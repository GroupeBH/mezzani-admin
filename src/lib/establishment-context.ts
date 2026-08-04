export type EstablishmentCacheTag =
  | "Menu"
  | "Staff"
  | "Bookings"
  | "Order"
  | "Cash"
  | "Sale"
  | "Stock"
  | "Debt"
  | "Audit"
  | "Summary";

export function resolveActiveEstablishmentId(
  accessibleIds: string[],
  rememberedId: string | null,
) {
  if (rememberedId && accessibleIds.includes(rememberedId)) {
    return rememberedId;
  }
  return accessibleIds[0] ?? null;
}

export function canCreateEstablishment(input: {
  organizationStatus: "ACTIVE" | "SUSPENDED" | "TRIAL";
  subscriptionStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "SUPERSEDED" | "LEGACY";
  permissions: string[];
  establishmentCount: number;
  maxEstablishments: number | null;
}) {
  return (
    input.organizationStatus !== "SUSPENDED" &&
    (input.subscriptionStatus === "ACTIVE" || input.subscriptionStatus === "LEGACY") &&
    input.permissions.includes("establishment:create") &&
    (input.maxEstablishments === null || input.establishmentCount < input.maxEstablishments)
  );
}

export function scopedInvalidationTags(establishmentId: string) {
  const types: EstablishmentCacheTag[] = [
    "Menu",
    "Staff",
    "Bookings",
    "Order",
    "Cash",
    "Sale",
    "Stock",
    "Debt",
    "Audit",
    "Summary",
  ];
  return types.map((type) => ({ type, id: establishmentId }));
}

export function activationRegistrationRequest(input: {
  key: string;
  name: string;
  organizationName: string;
  email: string;
  phone: string;
  password: string;
}) {
  return {
    key: input.key.trim(),
    name: input.name.trim(),
    organization_name: input.organizationName.trim() || undefined,
    email: input.email.trim() || undefined,
    phone: input.phone.trim() || undefined,
    password: input.password,
  };
}

export function activeIdAfterCreation(createdId: string) {
  const value = createdId.trim();
  if (!value) throw new Error("created establishment id is required");
  return value;
}
