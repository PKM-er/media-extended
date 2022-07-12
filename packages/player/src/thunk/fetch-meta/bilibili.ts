import { PayloadAction } from "@reduxjs/toolkit";
import { Provider } from "mx-base";
import { selectMeta } from "mx-store";

import { logNotMatch, ReducerBuilder } from "./common";

export interface BilibiliMeta {
  title: string;
}
const source = "fetchBiliMeta";

export const name = ["meta", source].join("/");

export const fetchBiliMetaReducers = (builder: ReducerBuilder) =>
  builder
    .addCase(name + "/pending", (state) => {
      const meta = selectMeta(state);
      if (meta?.provider === Provider.bilibili) meta.title = "";
      else logNotMatch(source, meta);
    })
    .addCase<string, PayloadAction<BilibiliMeta>>(
      name + "/fulfilled",
      (state, action) => {
        const { title } = action.payload;
        const meta = selectMeta(state);
        if (meta?.provider === Provider.bilibili) meta.title = title;
        else logNotMatch(source, meta);
      },
    )
    .addCase<string, PayloadAction<unknown>>(
      name + "/rejected",
      (state, action) => {
        const meta = selectMeta(state);
        if (meta?.provider === Provider.bilibili) {
        } else logNotMatch(source, meta);
        console.error(`Failed to ${source}: `, action.payload);
      },
    );
