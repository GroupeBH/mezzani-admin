import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CurrencyCode, MenuItem, OrderType } from "@/lib/types";

export type PosCartLine = {
  itemId: string;
  name: string;
  price: number;
  currency: CurrencyCode;
  quantity: number;
  note: string;
};

type PosState = {
  orderType: OrderType;
  tableNumber: string;
  deliveryAddress: string;
  cart: PosCartLine[];
};

const initialState: PosState = {
  orderType: "table_order",
  tableNumber: "T4",
  deliveryAddress: "",
  cart: [],
};

const posSlice = createSlice({
  name: "pos",
  initialState,
  reducers: {
    setOrderType(state, action: PayloadAction<OrderType>) {
      state.orderType = action.payload;
    },
    setTableNumber(state, action: PayloadAction<string>) {
      state.tableNumber = action.payload;
    },
    setDeliveryAddress(state, action: PayloadAction<string>) {
      state.deliveryAddress = action.payload;
    },
    addItem(state, action: PayloadAction<MenuItem>) {
      const item = action.payload;
      const line = state.cart.find((entry) => entry.itemId === item.item_id);
      if (line) {
        line.quantity += 1;
        return;
      }

      state.cart.push({
        itemId: item.item_id,
        name: item.name,
        price: item.price,
        currency: item.currency || "CDF",
        quantity: 1,
        note: "",
      });
    },
    removeItem(state, action: PayloadAction<string>) {
      state.cart = state.cart.filter((entry) => entry.itemId !== action.payload);
    },
    setItemQuantity(state, action: PayloadAction<{ itemId: string; quantity: number }>) {
      const line = state.cart.find((entry) => entry.itemId === action.payload.itemId);
      if (!line) {
        return;
      }

      line.quantity = Math.max(1, action.payload.quantity);
    },
    setItemNote(state, action: PayloadAction<{ itemId: string; note: string }>) {
      const line = state.cart.find((entry) => entry.itemId === action.payload.itemId);
      if (line) {
        line.note = action.payload.note;
      }
    },
    clearCart(state) {
      state.cart = [];
    },
  },
});

export const {
  addItem,
  clearCart,
  removeItem,
  setDeliveryAddress,
  setItemNote,
  setItemQuantity,
  setOrderType,
  setTableNumber,
} = posSlice.actions;

export default posSlice.reducer;
