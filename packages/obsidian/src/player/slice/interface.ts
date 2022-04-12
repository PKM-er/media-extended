import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Controls = "native" | "custom" | "none";

export interface InterfaceState {
  controls: Controls;
  ratio: string | null;
}

const initialState: InterfaceState = {
  controls: "native",
  ratio: null,
};

export const interfaceSlice = createSlice({
  name: "interface",
  initialState,
  reducers: {
    // setControls: (state, action: PayloadAction<boolean>) => {
    //   state.controls = action.payload ? initialState.controls : "none";
    // },
    setRatio: (
      state,
      action: PayloadAction<string | [width: number, height: number]>,
    ) => {
      if (Array.isArray(action.payload)) {
        const [width, height] = action.payload;
        state.ratio = `${width}/${height}`;
      } else {
        state.ratio = action.payload;
      }
    },
    resetRatio: (state) => {
      state.ratio = initialState.ratio;
    },
  },
});

export const { /* setControls, */ setRatio, resetRatio } =
  interfaceSlice.actions;

export default interfaceSlice.reducer;
