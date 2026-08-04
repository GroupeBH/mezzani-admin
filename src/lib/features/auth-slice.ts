import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  AccountSessionResponse,
  AuthenticatedStaffResponse,
  RestaurantTokenPair,
} from "@/lib/types";

const storageKey = "mezani.account.auth.v2";
const legacyStorageKey = "mezani.restaurant.auth.v1";

export type AuthSession = AccountSessionResponse | AuthenticatedStaffResponse;

export type AuthState = {
  session: AuthSession | null;
  hydrated: boolean;
};

const initialState: AuthState = {
  session: null,
  hydrated: false,
};

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AccountSessionResponse & AuthenticatedStaffResponse>;
  const hasTokens = Boolean(candidate.tokens?.access_token && candidate.tokens?.refresh_token);
  const hasAccount = Boolean(candidate.user?.id && candidate.organization?.id);
  const hasLegacyStaff = Boolean(candidate.staff?.restaurant_id && candidate.staff?.id);
  return hasTokens && (hasAccount || hasLegacyStaff);
}

export function isAccountSession(session: AuthSession): session is AccountSessionResponse {
  return "user" in session && "organization" in session;
}

export function readStoredAuthSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(session));
  window.localStorage.removeItem(legacyStorageKey);
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
  window.localStorage.removeItem(legacyStorageKey);
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthSession(state, action: PayloadAction<AuthSession>) {
      state.session = action.payload;
      state.hydrated = true;
    },
    updateAuthTokens(state, action: PayloadAction<RestaurantTokenPair>) {
      if (state.session) {
        state.session.tokens = action.payload;
      }
    },
    clearAuthSession(state) {
      state.session = null;
      state.hydrated = true;
    },
    finishAuthHydration(state) {
      state.hydrated = true;
    },
  },
});

export const { clearAuthSession, finishAuthHydration, setAuthSession, updateAuthTokens } =
  authSlice.actions;
export default authSlice.reducer;
