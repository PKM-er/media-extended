import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface InterfaceState {
  nativeControls: boolean;
  customControls: boolean;
  ratio: string | null;
}

const initialState: InterfaceState = {
  nativeControls: true,
  customControls: false,
  ratio: null,
};

export const interfaceSlice = createSlice({
  name: "interface",
  initialState,
  reducers: {
    setRatio: (state, action: PayloadAction<string>) => {
      state.ratio = action.payload;
    },
    resetRatio: (state) => {
      state.ratio = initialState.ratio;
    },
  },
});

export const { setRatio, resetRatio } = interfaceSlice.actions;

export default interfaceSlice.reducer;
