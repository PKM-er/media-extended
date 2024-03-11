/* eslint-disable deprecation/deprecation */
import type {
  Editor,
  MarkdownFileInfo,
  App,
  Command,
  TFile,
  Plugin,
  Modifier,
} from "obsidian";
import { Keymap, MarkdownView } from "obsidian";
import type { MediaInfo } from "@/media-view/media-info";
import type { MediaView } from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import { isMediaLeaf } from "../leaf-open";

function checkCallbacks(
  onRegular: ((checking: boolean) => boolean | void) | undefined | false,
  onEditor:
    | ((
        checking: boolean,
        editor: Editor,
        ctx: MarkdownView | MarkdownFileInfo,
      ) => boolean | void)
    | undefined
    | false,
  app: App,
) {
  return (checking: boolean): boolean | void => {
    const activeEditor = app.workspace.activeEditor;
    if (!activeEditor) {
      if (!onRegular) return;
      return onRegular(checking);
    }
    if (!onEditor) return;
    // from app.js
    if ((activeEditor as MarkdownView).getMode() !== "preview") {
      if (activeEditor instanceof MarkdownView) {
        if ((activeEditor as any).inlineTitleEl.isActiveElement()) return;
      }
      return onEditor(checking, activeEditor.editor!, activeEditor);
    }
  };
}
export interface MediaViewCallback {
  playerCheckCallback: (checking: boolean, view: MediaView) => boolean | void;
  noteCheckCallback: (
    checking: boolean,
    view: MediaView | undefined,
    noteCtx: {
      file: TFile;
      editor: Editor;
      isMediaNote: MediaInfo | undefined;
    },
  ) => boolean | void;
}
export function addMediaViewCommand(
  {
    playerCheckCallback,
    noteCheckCallback,
    ...command
  }: Omit<
    Command,
    "callback" | "checkCallback" | "editorCheckCallback" | "editorCallback"
  > &
    Partial<MediaViewCallback> & {
      section?: string;
      menu?: boolean;
    },
  plugin: MxPlugin,
): Command {
  const { app } = plugin;
  const cmd = plugin.addCommand({
    ...command,
    checkCallback: checkCallbacks(
      playerCheckCallback &&
        ((checking) => {
          if (!playerCheckCallback) return false;
          if (!isMediaLeaf(app.workspace.activeLeaf)) return false;
          if (checking) return true;
          return playerCheckCallback(checking, app.workspace.activeLeaf.view);
        }),
      noteCheckCallback &&
        ((checking, editor, ctx) => {
          if (!ctx.file) return false;
          const mediaInfo = plugin.mediaNote.findMedia(ctx.file);
          const mediaLeaf = plugin.leafOpener.detectActiveMediaLeaf(
            app.workspace.activeLeaf,
          );
          return noteCheckCallback(checking, mediaLeaf?.view, {
            isMediaNote: mediaInfo,
            file: ctx.file,
            editor,
          });
        }),
      app,
    ),
  });
  if (!noteCheckCallback || !command.menu) return cmd;
  plugin.registerEvent(
    plugin.app.workspace.on("editor-menu", (menu, editor, ctx) => {
      if (!ctx.file) return false;
      const mediaInfo = plugin.mediaNote.findMedia(ctx.file);
      const mediaLeaf = plugin.leafOpener.detectActiveMediaLeaf(
        app.workspace.activeLeaf,
      );
      if (
        !noteCheckCallback(true, mediaLeaf?.view, {
          isMediaNote: mediaInfo,
          file: ctx.file,
          editor,
        })
      )
        return;
      const file = ctx.file;
      menu.addItem((item) => {
        command.icon && item.setIcon(command.icon);
        command.name && item.setTitle(command.name);
        command.section && item.setSection(command.section);
        item.onClick(() => {
          noteCheckCallback(false, mediaLeaf?.view, {
            isMediaNote: mediaInfo,
            file,
            editor,
          });
        });
      });
    }),
  );
  return cmd;
}

export function handleRepeatHotkey<Params extends any[]>(
  plugin: Plugin,
  {
    onKeyDown,
    onTrigger,
    onKeyUp,
  }: {
    onKeyDown: (evt: KeyboardEvent, ...params: Params) => void;
    onTrigger?: (...params: Params) => void;
    onKeyUp?: (evt: KeyboardEvent, ...params: Params) => void;
  },
) {
  let disbatched: Params | null = null;
  const keyupHandlers = new Set<(...arg: any[]) => void>();
  plugin.register(() => {
    keyupHandlers.forEach((handler) => {
      window.removeEventListener("keyup", handler, { capture: true });
    });
  });
  plugin.registerDomEvent(
    window,
    "keydown",
    (evt) => {
      if (!disbatched) return;
      const target = evt.target as HTMLElement;
      if (
        target.instanceOf(HTMLElement) &&
        target.matches("input.prompt-input")
      )
        return;

      // if keydown event is not fired
      const hotkey = evt;
      onKeyDown(evt, ...disbatched);
      if (onKeyUp) {
        const params = disbatched;
        const handler = (evt: KeyboardEvent) => {
          const modifiers = toModifiers(hotkey);
          // in macOS, regular key up will not fired when meta key is pressed, only meta keyup is fired
          if (
            (evt.code === hotkey.code &&
              modifiers.every((m) => Keymap.isModifier(evt, m))) ||
            modifiers.some((m) => evt.key === m)
          ) {
            onKeyUp(evt, ...params);
            window.removeEventListener("keyup", handler, { capture: true });
            keyupHandlers.delete(handler);
          }
        };
        keyupHandlers.add(handler);
        window.addEventListener("keyup", handler, {
          passive: true,
          capture: true,
        });
      }
      disbatched = null;
    },
    true,
  );
  return {
    callback: (...params: Params) => {
      disbatched = params;
      setTimeout(() => {
        // macrotask are executed after all event handlers
        // here check if the event is handled by keydown handler
        if (disbatched === null) {
          // console.debug("command evoked from keyboard");
        } else {
          // console.log("command evoked from command");
          onTrigger?.(...params);
          disbatched = null;
        }
      }, 0);
    },
  };
}

function toModifiers(evt: KeyboardEvent) {
  const modifiers = [] as Modifier[];
  if (evt.ctrlKey) modifiers.push("Ctrl");
  if (evt.altKey) modifiers.push("Alt");
  if (evt.shiftKey) modifiers.push("Shift");
  if (evt.metaKey) modifiers.push("Meta");
  return modifiers;
}
