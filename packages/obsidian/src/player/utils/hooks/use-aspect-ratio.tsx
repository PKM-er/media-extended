// from https://github.com/roderickhsiao/react-aspect-ratio
import "@styles/aspect-ratio.less";

import { useAppSelector } from "@player/hooks";
import { selectPlayerType } from "@slice/provider";
import cls, { Argument } from "classnames";
import React from "react";

const CUSTOM_PROPERTY_NAME = "--aspect-ratio";
const DEFAULT_CLASS_NAME = "react-aspect-ratio-placeholder";

const DefaultRatio = {
  video: "16/9",
  unknown: "16/9",
  audio: 0,
  youtube: "16/9",
  vimeo: "16/9",
  webview: "16/9",
} as const;

const useAspectRatio = (
  keepRatio: "width" | "height",
  _className?: Argument[],
) => {
  const provider = useAppSelector(selectPlayerType);
  let ratio = useAppSelector((state) => state.interface.ratio);
  if (ratio === null && provider) {
    ratio = DefaultRatio[provider];
  }
  let style: React.CSSProperties = {
    height: keepRatio === "width" ? "auto" : "100%",
    width: keepRatio === "height" ? "auto" : "100%",
  };
  if (typeof ratio === "string") {
    (style as any)[CUSTOM_PROPERTY_NAME] = `(${ratio})`;
  }

  const className = cls(_className ?? DEFAULT_CLASS_NAME, { active: !!ratio });
  return { style, className };
};
export default useAspectRatio;
