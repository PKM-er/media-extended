import { Provider } from "mx-base";

export interface MetaBase {
  provider: Provider | null;
  title?: string;
  details?: string;
  linkTitle?: string;
}
export interface MediaUrlMetaBase extends MetaBase {
  /** source given url, hash stripped */
  url: string;
  id?: string;
}
