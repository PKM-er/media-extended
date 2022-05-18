import type { ActionReducerMapBuilder } from "@reduxjs/toolkit";

import type { RootState } from "..";
import Controlled from "./controlled";
import Source from "./source";

const extraReducers = (builder: ActionReducerMapBuilder<RootState>): void => (
  Source(builder), Controlled(builder), void 0
);
export default extraReducers;

export type ExtraReducers = typeof extraReducers;
