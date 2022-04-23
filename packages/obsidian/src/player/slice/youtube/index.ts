import { getYoutubeSlice } from "./slice";

export const {
  handlePlayerReady,
  requsetSetVolumeByOffest,
  setVolumeByOffestDone,
  handleStateChange,
} = getYoutubeSlice().actions;

export default getYoutubeSlice;
