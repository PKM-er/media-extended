import {
  MenuUnstyledContext,
  MenuUnstyledContextType,
  useMenu,
} from "@mui/base";
import MenuItem from "@mui/base/MenuItemUnstyled";
import { useAppDispatch, useAppSelector } from "@store-hooks";
import { setActiveTrack, toggleTracks } from "mx-store";
import React from "react";
import { FiCheck } from "react-icons/fi";

export const TracksMenu = () => {
  const tracks = useAppSelector((state) => state.interface.textTracks.list);
  const active = useAppSelector((state) => state.interface.textTracks.active);
  const enabled = useAppSelector((state) => state.interface.textTracks.enabled);
  const dispatch = useAppDispatch();
  return (
    <Menu className="menu">
      {tracks.map((track, i) => {
        return (
          <MenuItem
            className="menu-item"
            key={[track.kind, track.label, track.language].join(";")}
            label={track.label}
            component="div"
            onClick={() => {
              if (i === active) dispatch(toggleTracks());
              else dispatch(setActiveTrack(i));
            }}
          >
            {enabled && active === i ? (
              <FiCheck className="menu-item-icon" />
            ) : (
              <div className="menu-item-icon"></div>
            )}
            <span className="menu-item-title">
              {track.label ? track.label : "Default"}
            </span>
            {track.language && (
              <span className="mx__menu-value">
                <span className="mx__caption-badge">{track.language}</span>
              </span>
            )}
          </MenuItem>
        );
      })}
    </Menu>
  );
};

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
const Menu = React.forwardRef(function Menu(
  props: React.ComponentPropsWithoutRef<"div">,
  ref: React.Ref<HTMLDivElement>,
) {
  const { children, ...other } = props;

  const {
    registerItem,
    unregisterItem,
    getListboxProps,
    getItemProps,
    getItemState,
  } = useMenu({ listboxRef: ref });

  const contextValue: MenuUnstyledContextType = {
    registerItem,
    unregisterItem,
    getItemState,
    getItemProps,
    open: true,
  };

  return (
    <div className="menu" {...other} {...getListboxProps()}>
      <MenuUnstyledContext.Provider value={contextValue}>
        {children}
      </MenuUnstyledContext.Provider>
    </div>
  );
});

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
// const MenuItem = React.forwardRef(function MenuItem(
//   props: React.ComponentPropsWithoutRef<"div">,
//   ref: React.Ref<any>,
// ) {
//   const { children, ...other } = props;

//   const { getRootProps, itemState } = useMenuItem({ component: "div", ref });

//   const classes = {
//     "menu-item": true,
//     disabled: itemState?.disabled,
//   };

//   return (
//     <div className={cls(classes)} {...other} {...getRootProps()}>
//       {children}
//     </div>
//   );
// });
