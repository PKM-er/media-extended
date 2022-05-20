import "@styles/button.less";

// import { useIcon } from "@hook-utils";
import type { ButtonUnstyledProps } from "@mui/base";
import { useButton } from "@mui/base";
import cls from "classnames";
import React from "react";
import { useMergeRefs } from "use-callback-ref";

export type ToggleButtonProps = ButtonUnstyledProps & {
  selected: boolean;
  selectedIcon: React.ReactNode;
  unselectedIcon: React.ReactNode;
  id?: string;
};

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  function ToggleButton(props, ref) {
    const {
      children,
      selected,
      selectedIcon,
      unselectedIcon,
      onClick,
      onChange,
      id,
      ...other
    } = props;

    const { active, disabled, focusVisible, getRootProps } = useButton({
      ...props,
      ref,
    });

    const handleChange = (event: any) => {
      if (onClick) {
        onClick(event);
        if (event.defaultPrevented) {
          return;
        }
      }
      if (onChange) {
        onChange(event);
      }
    };

    const classes = {
        active,
        disabled,
        focusVisible,
        selected,
      },
      { ref: buttonRef, ...rootProps } = getRootProps();
    // seems that ref return from useButton is not working
    // with @floating-ui/react-dom-interactions
    // use ref from forwardRef instead
    return (
      <button
        ref={ref}
        {...other}
        {...rootProps}
        id={id}
        className={cls("mx__toggle-button", classes)}
        onClick={handleChange}
        onChange={onChange}
        aria-pressed={selected}
      >
        {selectedIcon}
        {unselectedIcon}
        {children}
      </button>
    );
  },
);

export default React.memo(ToggleButton);
