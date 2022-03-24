import assertNever from "assert-never";
import { MediaType } from "mx-lib";
import React, { forwardRef, useState } from "preact/compat";
import { JSXInternal } from "preact/src/jsx";
type H5PlayerProps = Omit<
  JSXInternal.HTMLAttributes<HTMLMediaElement>,
  "ref"
> & {
  type: MediaType;
  onMediaTypeDetermined?: (type: Exclude<MediaType, MediaType.Unknown>) => void;
};

const H5MediaProvider = forwardRef<HTMLMediaElement, H5PlayerProps>(
  ({ type, onMediaTypeDetermined, ...playerProps }, ref) => {
    const [mediaType, setMediaType] = useState(
      type === MediaType.Unknown ? MediaType.Video : type,
    );
    let player;
    switch (mediaType) {
      case MediaType.Audio:
        player = <audio ref={ref} {...playerProps} />;
        break;
      case MediaType.Video:
        player = (
          <video
            ref={ref as any}
            {...playerProps}
            onLoadedMetadata={(evt) => {
              const video = evt.target as HTMLVideoElement;
              if (video.videoHeight === 0 && video.videoWidth === 0) {
                setMediaType(MediaType.Audio);
                onMediaTypeDetermined && onMediaTypeDetermined(MediaType.Audio);
              } else {
                onMediaTypeDetermined && onMediaTypeDetermined(MediaType.Video);
              }
            }}
          />
        );
        break;
      default:
        assertNever(mediaType);
    }
    return player;
  },
);
export default H5MediaProvider;
