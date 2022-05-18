import { SerializableTFile } from "./types";

export const getTitleFromObFile = (file: SerializableTFile) => file.basename;
