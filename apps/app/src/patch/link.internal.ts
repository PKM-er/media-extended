import { around } from "monkey-around";
import { Workspace } from "obsidian";
import type MxPlugin from "@/mx-main";
import type { LinkEvent } from "./event";
import { toPaneAction } from "./mod-evt";

export default function patchLinktextOpen(
  this: MxPlugin,
  { onInternalLinkClick }: Pick<LinkEvent, "onInternalLinkClick">,
) {
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const plugin = this;

  this.register(
    around(Workspace.prototype, {
      openLinkText: (next) =>
        async function (
          this: Workspace,
          linktext,
          sourcePath,
          newLeaf,
          openViewState,
          ...args
        ) {
          const fallback = () =>
            next.call(
              this,
              linktext,
              sourcePath,
              newLeaf,
              openViewState,
              ...args,
            );
          try {
            await onInternalLinkClick.call(
              plugin,
              linktext,
              sourcePath,
              toPaneAction(newLeaf),
              fallback,
            );
          } catch (e) {
            console.error(
              `onInternalLinkClick error in openLinktext, fallback to default`,
              e,
            );
            fallback();
          }
        },
    }),
  );
}
