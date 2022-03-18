import React, { useCallback } from "react";

interface ButtonProps {
  disabled?: boolean;
  hidden?: boolean;
  onClick: (evt: React.PointerEvent | React.KeyboardEvent) => void;
  "aria-label": string;
}
const Button = React.forwardRef<HTMLDivElement, ButtonProps>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function Button(
    { disabled = false, hidden = false, onClick, "aria-label": ariaLabel },
    ref,
  ) {
    const handleClick = useCallback(
        (evt: React.PointerEvent | React.KeyboardEvent) => {
          if (
            disabled ||
            // not keyboard click
            (evt instanceof KeyboardEvent &&
              !(evt.key === "Enter" || evt.key === " "))
          )
            return;
          onClick(evt);
        },
        [disabled, onClick],
      ),
      handleClickCapture = useCallback(
        (evt: React.MouseEvent) => {
          if (disabled) {
            evt.preventDefault();
            evt.stopPropagation();
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
