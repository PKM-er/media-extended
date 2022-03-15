import "obsidian";

import { App, View, WorkspaceLeaf } from "obsidian";

declare module "obsidian" {
  interface ViewRegistry {
    typeByExtension: Record<string, string>;
    viewByType: Record<string, ViewCreator>;
    getViewCreatorByType(type: string): ViewCreator | undefined;
    isExtensionRegistered(ext: string): boolean;
    registerExtensions(exts: string[], type: string): void;
    registerViewWithExtensions(
      exts: string[],
      type: string,
      viewCreator: ViewCreator,
    ): void;
    unregisterExtensions(exts: string[]): void;
  }
  interface App {
    viewRegistry: ViewRegistry;
  }
}

const getViewOfType = <V extends View = View>(
  type: string,
  app: App,
): V | null => {
  const vc = app.viewRegistry.getViewCreatorByType(type);
  return vc ? (vc(new (WorkspaceLeaf as any)(app)) as V) : null;
};

export const getViewCtorOfType = <V extends typeof View = typeof View>(
  type: string,
  app: App,
) => {
  let instance = getViewOfType(type, app);
  const ctor = instance?.constructor as V;
  if (!ctor) {
    console.error(`Could not get view constructor of type ${type}`);
    return null;
  } else {
    return ctor;
  }
};

import "obsidian";

import { around } from "monkey-around";
import type { AudioView, displayInElFunc, VideoView } from "obsidian";

import { getInternalMediaInfo } from "../base/media-info";
import { CONTROLS_ENABLED_CLASS, MediaView } from "../media-view-v2";
import type MediaExtended from "../mx-main";
import { ElementWithRenderChild } from "./base";

declare module "obsidian" {
  type displayInElFunc = (
    file: TFile,
    app: App,
    containerEl: HTMLElement,
  ) => Promise<void>;
  abstract class AudioView extends FileView {
    static displayInEl: displayInElFunc;
  }
  abstract class VideoView extends FileView {
    static displayInEl: displayInElFunc;
  }
}

const patchMediaEmbed = (plugin: MediaExtended) => {
  let VideoViewCtor = getViewCtorOfType<typeof VideoView>("video", plugin.app),
    AudioViewCtor = getViewCtorOfType<typeof AudioView>("audio", plugin.app);
  if (!VideoViewCtor || !AudioViewCtor) return;
  const displayInEl = (next: displayInElFunc): displayInElFunc =>
    async function (this: any, file, app, containerEl, ...args) {
      const fallback = () => next.call(this, file, app, containerEl, ...args);
      try {
        if (
          containerEl instanceof HTMLDivElement &&
          plugin.settings.livePreview
        ) {
          containerEl.style.display = "none"; // prevent default live preview player from rendering
        } else if (
          containerEl instanceof HTMLSpanElement &&
          plugin.settings.mediaFragmentsEmbed &&
          containerEl.hasClass(CONTROLS_ENABLED_CLASS) // handled by md postprocessor
        ) {
          let info = await getInternalMediaInfo(
            {
              linktext: containerEl.getAttr("src") ?? file.path,
              sourcePath: file.path,
              file,
            },
            app,
          );
          if (!info) return fallback();
          const child = MediaView.displayInEl(info, app, containerEl);
          (containerEl as ElementWithRenderChild).renderChild = child;
          child.load();
          containerEl.addClass("is-loaded");
        } else fallback();
      } catch (error) {
        return fallback();
      }
    };
  const unloaders = [
    around(VideoViewCtor, { displayInEl }),
    around(AudioViewCtor, { displayInEl }),
  ];
  plugin.register(() => {
    unloaders.forEach((unloader) => unloader());
  });
};
export default patchMediaEmbed;
