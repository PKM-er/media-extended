import { PayloadAction } from "@reduxjs/toolkit";
import { Provider } from "mx-base";
import { selectMeta } from "mx-store";

import { logNotMatch, ReducerBuilder } from "./common";

export interface YoutubeMeta {
  title: string;
}
const source = "fetchYoutubeMeta";

export const name = ["meta", source].join("/");

export const fetchYoutubeMetaReducers = (builder: ReducerBuilder) =>
  builder
    .addCase(name + "/pending", (state) => {
      const meta = selectMeta(state);
      if (meta?.provider === Provider.youtube) meta.title = "";
      else logNotMatch(source, meta);
    })
    .addCase<string, PayloadAction<YoutubeMeta>>(
      name + "/fulfilled",
      (state, action) => {
        const meta = selectMeta(state);
        const { title } = action.payload;
        if (meta?.provider === Provider.youtube) meta.title = title;
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
