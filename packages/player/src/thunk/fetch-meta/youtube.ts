import { PayloadAction } from "@reduxjs/toolkit";
import { Provider } from "mx-base";
import { metaSlice } from "mx-store";

import { logNotMatch, ReducerBuilder } from "./common";

export interface YoutubeMeta {
  title: string;
}
const source = "fetchYoutubeMeta";

export const name = [metaSlice.name, source].join("/");

export const fetchYoutubeMetaReducers = (builder: ReducerBuilder) =>
  builder
    .addCase(name + "/pending", ({ meta }) => {
      if (meta.provider === Provider.youtube) meta.title = "";
      else logNotMatch(source, meta);
    })
    .addCase<string, PayloadAction<YoutubeMeta>>(
      name + "/fulfilled",
      ({ meta }, action) => {
        const { title } = action.payload;
        if (meta.provider === Provider.youtube) meta.title = title;
        else logNotMatch(source, meta);
      },
    )
    .addCase<string, PayloadAction<unknown>>(
      name + "/rejected",
      ({ meta }, action) => {
        if (meta.provider === Provider.bilibili) {
        } else logNotMatch(source, meta);
        console.error(`Failed to ${source}: `, action.payload);
      },
    );