import { configureStore } from "@reduxjs/toolkit";
import appReducer from "@/lib/features/app-slice";
import posReducer from "@/lib/features/pos-slice";
import { mezaniApi } from "@/lib/services/mezani-api";

export const store = configureStore({
  reducer: {
    app: appReducer,
    pos: posReducer,
    [mezaniApi.reducerPath]: mezaniApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(mezaniApi.middleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
