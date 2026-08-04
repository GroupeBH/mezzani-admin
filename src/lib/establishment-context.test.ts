import assert from "node:assert/strict";
import test from "node:test";
import {
  activationRegistrationRequest,
  activeIdAfterCreation,
  canCreateEstablishment,
  resolveActiveEstablishmentId,
  scopedInvalidationTags,
} from "./establishment-context.ts";

test("activation registration sends the customer key without a restaurant id", () => {
  const request = activationRegistrationRequest({
    key: " MZ-test ", name: " Amina Owner ", organizationName: " Groupe Amina ",
    email: " owner@example.com ", phone: "", password: "password-123",
  });
  assert.equal(request.key, "MZ-test");
  assert.equal(request.organization_name, "Groupe Amina");
  assert.equal("restaurant_id" in request, false);
});

test("the first created establishment immediately becomes active", () => {
  assert.equal(activeIdAfterCreation(" site-created "), "site-created");
});

test("an account without an establishment has no active context", () => {
  assert.equal(resolveActiveEstablishmentId([], null), null);
});

test("the only accessible establishment becomes active", () => {
  assert.equal(resolveActiveEstablishmentId(["site-1"], null), "site-1");
});

test("a remembered accessible establishment persists after reload", () => {
  assert.equal(resolveActiveEstablishmentId(["site-1", "site-2"], "site-2"), "site-2");
});

test("an inaccessible remembered establishment redirects to a valid one", () => {
  assert.equal(resolveActiveEstablishmentId(["site-1", "site-2"], "forged"), "site-1");
});

test("switch invalidation remains scoped to the previous establishment", () => {
  const tags = scopedInvalidationTags("site-1");
  assert.ok(tags.length >= 8);
  assert.ok(tags.every((tag) => tag.id === "site-1"));
  assert.ok(tags.some((tag) => tag.type === "Order"));
  assert.ok(tags.some((tag) => tag.type === "Stock"));
});

test("a manager without explicit permission cannot create", () => {
  assert.equal(
    canCreateEstablishment({
      organizationStatus: "ACTIVE",
      subscriptionStatus: "ACTIVE",
      permissions: ["establishment:read"],
      establishmentCount: 0,
      maxEstablishments: null,
    }),
    false,
  );
});

test("an authorized manager can create below the limit", () => {
  assert.equal(
    canCreateEstablishment({
      organizationStatus: "ACTIVE",
      subscriptionStatus: "ACTIVE",
      permissions: ["establishment:create"],
      establishmentCount: 1,
      maxEstablishments: 2,
    }),
    true,
  );
});

test("the organization limit and suspension are reflected in the UI", () => {
  assert.equal(
    canCreateEstablishment({ organizationStatus: "ACTIVE", subscriptionStatus: "ACTIVE", permissions: ["establishment:create"], establishmentCount: 2, maxEstablishments: 2 }),
    false,
  );
  assert.equal(
    canCreateEstablishment({ organizationStatus: "SUSPENDED", subscriptionStatus: "ACTIVE", permissions: ["establishment:create"], establishmentCount: 0, maxEstablishments: null }),
    false,
  );
});

test("an expired paid plan blocks new establishments", () => {
  assert.equal(
    canCreateEstablishment({ organizationStatus: "ACTIVE", subscriptionStatus: "EXPIRED", permissions: ["establishment:create"], establishmentCount: 0, maxEstablishments: 3 }),
    false,
  );
});
