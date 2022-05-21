import { setDirectLink, setHostMedia, setObsidianMedia } from "../source";

export const resetActions = [setObsidianMedia, setDirectLink, setHostMedia].map(
  (a) => a.type,
);
