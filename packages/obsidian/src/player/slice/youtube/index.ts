import { getYoutubeSlice } from "./slice";

export const {
  handlePlayerReady,
  requsetSetVolumeByOffest,
  setVolumeByOffestDone,
} = getYoutubeSlice().actions;

export default getYoutubeSlice;
