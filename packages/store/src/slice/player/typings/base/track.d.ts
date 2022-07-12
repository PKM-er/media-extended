interface Subtitle {
  src: string;
  kind: "subtitles";
  // must be a valid BCP 47 language tag
  srcLang?: string;
  label?: string;
  default?: boolean;
}
interface Caption {
  src: string;
  kind: "captions";
  default: boolean;
}

export type Track = Caption | Subtitle;
