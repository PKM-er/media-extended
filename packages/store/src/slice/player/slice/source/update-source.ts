import { PayloadAction } from "@reduxjs/toolkit";
import { Provider } from "mx-base";

import { createSlice } from "../../../create-slice";
import { PlayerType } from "../../typings";
import { HTML5MediaState, SerializableTFile } from "../../typings/html5";
import { getTitleFromObFile } from "./utils";

const { actions, reducer } = createSlice({
  name: "source",
  state: {} as HTML5MediaState,
  reducers: {
    renameObsidianMedia: (
      state,
      action: PayloadAction<{ file: SerializableTFile; src: string }>,
    ) => {
      const { src } = action.payload;
      state.source.src = src;
      if (state.meta.provider !== Provider.obsidian) {
        throw new Error(
          "Failed to rename obsidian media source: current source not from obsidian",
        );
      }
      const { file } = action.payload;
      state.meta.file = file;
      state.meta.title = getTitleFromObFile(file);
    },
    switchToAudio: (state) => {
      state.type = PlayerType.audio;
    },
    unknownTypeDetermined: (state) => {
      if (state.type === PlayerType.unknown) {
        state.type = PlayerType.video;
      } else {
        throw new TypeError(
          "player type invaild to call unknownTypeDetermined: " + state.type,
        );
      }
    },
    disableCORS: (state) => {
      state.source.allowCORS = false;
    },
  },
});

export default reducer;
export const {
  disableCORS,
  renameObsidianMedia,
  switchToAudio,
  unknownTypeDetermined,
} = actions;
