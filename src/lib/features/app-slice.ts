import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AppState = {
  selectedRestaurantId: string | null;
  sidebarCollapsed: boolean;
};

const initialState: AppState = {
  selectedRestaurantId: null,
  sidebarCollapsed: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setSelectedRestaurantId(state, action: PayloadAction<string | null>) {
      state.selectedRestaurantId = action.payload;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
  },
});

export const { setSelectedRestaurantId, setSidebarCollapsed } = appSlice.actions;
export default appSlice.reducer;
