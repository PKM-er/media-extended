// from https://github.com/roderickhsiao/react-aspect-ratio
import "@styles/aspect-ratio.less";

import { useAppSelector } from "@player/hooks";
import { selectPlayerType } from "@slice/provider";
import cls from "classnames";
import React, { HTMLProps, PropsWithoutRef } from "react";

const CUSTOM_PROPERTY_NAME = "--aspect-ratio";
const DEFAULT_CLASS_NAME = "react-aspect-ratio-placeholder";

type Props = PropsWithoutRef<HTMLProps<HTMLDivElement>>;

const DefaultRatio = {
  video: "16/9",
  unknown: "16/9",
  audio: null,
  youtube: "16/9",
  vimeo: "16/9",
  "browser-view": "16/9",
};

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export default React.forwardRef(function AspectRatio(
  { className = DEFAULT_CLASS_NAME, children, style, ...restProps }: Props,
  ref: React.Ref<HTMLDivElement>,
) {
  const provider = useAppSelector(selectPlayerType);
  let ratio = useAppSelector((state) => state.interface.ratio);
  if (ratio === null && provider) {
    ratio = DefaultRatio[provider];
  }
  const newStyle =
    ratio === null
      ? style
      : ({
          ...style,
          // https://github.com/roderickhsiao/react-aspect-ratio/commit/53ec15858ae186c41e70b8c14cc5a5b6e97cb6e3
          [CUSTOM_PROPERTY_NAME]: `(${ratio})`,
        } as React.CSSProperties);

  return (
    <div
      ref={ref}
      className={cls(className, { active: !!ratio })}
      style={newStyle}
      {...restProps}
    >
      {children}
    </div>
  );
});
