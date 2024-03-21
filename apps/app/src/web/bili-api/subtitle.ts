/* eslint-disable @typescript-eslint/naming-convention */
interface Subtitle {
  from: number;
  to: number;
  sid: number;
  location: number;
  content: string;
  music: number;
}

export interface SubtitlesConfig {
  font_size: number;
  font_color: string;
  background_alpha: number;
  background_color: string;
  Stroke: string;
  type: string;
  lang: string;
  version: string;
  body: Subtitle[];
}
