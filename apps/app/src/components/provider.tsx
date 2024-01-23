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
import { cn } from "@/lib/utils";
import { useApp } from "./context";
import { useControls } from "./hook/use-hash";
import { WebView } from "./webview";

export function MediaProviderEnhanced({
  loaders,
  ...props
}: Omit<MediaProviderProps, "buildMediaEl">) {
  const appId = useApp((x) => x.appId);
  const controls = useControls();
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
              className={cn(
                "data-[play-ready]:opacity-100 opacity-0 transition-opacity",
                controls && "pointer-events-none",
              )}
              webpreferences="autoplayPolicy=user-gesture-required"
              devtools
              partition={getPartition(appId)}
              ref={(inst) => {
                provider.load(inst);
              }}
            />
          );
        },
        [appId, controls],
      )}
      {...props}
    />
  );
}
