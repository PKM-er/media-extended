import type {
  MediaContext,
  MediaProviderLoader,
  MediaSrc,
  MediaType,
} from "@vidstack/react";
import type { WebviewTag } from "electron";

import { isString } from "maverick.js/std";
import { isWebpageUrl } from "./encode";
import { WebiviewMediaProvider } from "./provider";

export class WebviewProviderLoader
  implements MediaProviderLoader<WebiviewMediaProvider>
{
  readonly name = "webview";
  target!: WebviewTag;

  canPlay({ src }: MediaSrc) {
    return isString(src) && isWebpageUrl(src);
  }

  mediaType(): MediaType {
    return "video";
  }

  async load(ctx: MediaContext) {
    return new WebiviewMediaProvider(this.target, ctx);
  }
}
