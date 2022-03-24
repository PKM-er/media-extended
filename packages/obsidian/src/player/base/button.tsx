import React, { forwardRef, useCallback } from "preact/compat";

interface ButtonProps {
  disabled?: boolean;
  hidden?: boolean;
  onClick: (evt: PointerEvent | KeyboardEvent) => void;
  "aria-label": string;
}
const Button = forwardRef<HTMLDivElement, ButtonProps>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function Button(
    { disabled = false, hidden = false, onClick, "aria-label": ariaLabel },
    ref,
  ) {
    const handleClick = useCallback(
        (evt: PointerEvent | KeyboardEvent) => {
          if (
            disabled ||
            // not keyboard click
            (evt instanceof KeyboardEvent &&
              !(evt.key === "Enter" || evt.key === " "))
          )
            return;
          onClick(evt);
          console.log("click");
        },
        [disabled, onClick],
      ),
      handleClickCapture = useCallback(
        (evt: MouseEvent) => {
          if (disabled) {
            evt.preventDefault();
            evt.stopPropagation();
            evt.stopImmediatePropagation();
          }
        },
        [disabled],
      );

    return (
      <div
        role="button"
        tabIndex={0}
        ref={ref}
        onPointerDown={handleClick}
        onClickCapture={handleClickCapture}
        onKeyDown={handleClick}
        hidden={hidden}
        aria-label={ariaLabel}
      />
    );
  },
);
export default Button;
