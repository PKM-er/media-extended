import type { ActionReducerMapBuilder } from "@reduxjs/toolkit";
import { MediaMeta } from "mx-store";
import { RootState } from "mx-store";

export const logNotMatch = (type: string, state: MediaMeta) =>
  console.error(
    `failed to apply ${type} meta: current source not match`,
    state,
  );

export type ReducerBuilder = ActionReducerMapBuilder<RootState>;
