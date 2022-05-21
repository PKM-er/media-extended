import { setVolumeTo, trunc } from "../common";
import { setPlaybackRate, setVolumeByOffest } from "../controlled";
import { PlayerType } from "../source/types";
import { ExtraReducers } from ".";

const extraReducers: ExtraReducers = (builder) => {
  builder
    .addCase(setPlaybackRate, (state, action) => {
      const rate = action.payload;
      const setRate = (rate: number) => {
        state.controlled.playbackRate = rate > 0 ? rate : 1;
      };
      if (state.source.type === PlayerType.youtubeAPI) {
        const speeds = state.youtube.availableSpeeds;
        const max = speeds.length === 1 ? 2 : speeds[speeds.length - 1],
          min = speeds.length === 1 ? 0.25 : speeds[0];
        if (rate <= max && rate >= min) {
          setRate(trunc(rate));
        }
      } else setRate(rate);
    })
    .addCase(setVolumeByOffest, (state, action) => {
      const percent = action.payload;
      if (state.source.type === PlayerType.youtubeAPI) {
        state.youtube.volumeOffest = percent;
      } else {
        setVolumeTo(
          state.controlled.volume + action.payload / 100,
          state.controlled,
        );
      }
    });
};
export default extraReducers;
