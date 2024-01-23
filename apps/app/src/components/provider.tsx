import {
  MediaProvider,
  type MediaProviderAdapter,
  type MediaProviderInstance,
  type MediaProviderLoader,
  type MediaProviderProps,
} from "@vidstack/react";
import { useCallback } from "react";
import { getPartition } from "@/lib/remote-player/const";
import { WebviewProviderLoader } from "@/lib/remote-player/loader";
import { useApp } from "./context";
import { WebView } from "./webview";

export function MediaProviderEnhanced({
  loaders,
  ...props
}: Omit<MediaProviderProps, "buildMediaEl">) {
  const appId = useApp((x) => x.appId);
  return (
    <MediaProvider
      loaders={[WebviewProviderLoader, ...(loaders ?? [])]}
      buildMediaEl={useCallback(
        (
          loader: MediaProviderLoader<MediaProviderAdapter> | null,
          provider: MediaProviderInstance,
        ) => {
          if (!(loader instanceof WebviewProviderLoader)) return null;
          return (
            <WebView
              aria-hidden
              className="data-[play-ready]:opacity-100 opacity-0 transition-opacity"
              webpreferences="autoplayPolicy=user-gesture-required"
              // devtools
              partition={getPartition(appId)}
              ref={(inst) => {
                provider.load(inst);
              }}
            />
          );
        },
        [appId],
      )}
      {...props}
    />
  );
}
