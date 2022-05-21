import type { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { MediaMeta, RootState } from "mx-store";

export const logNotMatch = (type: string, state: MediaMeta) =>
  console.error(`failed to apply ${type}: current source not match`, state);

export type ReducerBuilder = ActionReducerMapBuilder<RootState>;
