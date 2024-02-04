import type { MenuItem } from "obsidian";
import type { PlayerContext } from ".";

export function transformMenu(
  item: MenuItem,
  { setTransform, transform }: PlayerContext,
) {
  const sub = item
    .setTitle("Transform")
    .setIcon("rotate-3d")
    .setSection("mx-player")
    .setSubmenu();

  if (
    transform?.flipHorizontal ||
    transform?.flipVertical ||
    transform?.rotate
  ) {
    sub.addItem((item) =>
      item
        .setIcon("reset")
        .setTitle("Reset")
        .onClick(() => setTransform(null)),
    );
  }

  sub
    .addItem((item) =>
      item
        .setTitle("Flip horizontally")
        .setIcon("flip-horizontal")
        .setChecked(!!transform?.flipHorizontal)
        .onClick(() =>
          setTransform({
            flipHorizontal: !transform?.flipHorizontal,
          }),
        ),
    )
    .addItem((item) =>
      item
        .setTitle("Flip vertically")
        .setIcon("flip-vertical")
        .setChecked(!!transform?.flipVertical)
        .onClick(() =>
          setTransform({
            flipVertical: !transform?.flipVertical,
          }),
        ),
    )
    .addSeparator()
    // .addItem((item) =>
    //   item
    //     .setTitle("Rotate 90° clockwise")
    //     .setIcon("corner-right-down")
    //     .setChecked(transform?.rotate === "90")
    //     .onClick(() =>
    //       setTransform({
    //         rotate: transform?.rotate === "90" ? undefined : "90",
    //       }),
    //     ),
    // )
    // .addItem((item) =>
    //   item
    //     .setTitle("Rotate 90° counter-clockwise")
    //     .setIcon("corner-left-down")
    //     .setChecked(transform?.rotate === "270")
    //     .onClick(() =>
    //       setTransform({
    //         rotate: transform?.rotate === "270" ? undefined : "270",
    //       }),
    //     ),
    // )
    .addItem((item) =>
      item
        .setChecked(transform?.rotate === "180")
        .setIcon("iteration-cw")
        .setTitle("Rotate 180°")
        .onClick(() => {
          setTransform({
            rotate: transform?.rotate === "180" ? undefined : "180",
          });
        }),
    );
}
