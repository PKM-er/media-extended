import { around } from "monkey-around";
import type { Command } from "obsidian";
import type MxPlugin from "@/mx-main";
import { LocalTranscriptView } from "./file-view";
import { WebpageTranscriptView } from "./webpage-view";

declare module "obsidian" {
  interface App {
    commands: {
      commands: Record<string, Command>;
    };
  }
}

export function registerTranscriptView(plugin: MxPlugin) {
  LocalTranscriptView.register(plugin);
  WebpageTranscriptView.register(plugin);
  plugin.app.workspace.onLayoutReady(() =>
    plugin.register(
      around(plugin.app.commands.commands["editor:open-search"] as Command, {
        checkCallback: (next) =>
          function (checking) {
            if (next?.(checking)) return true;
            const view =
              plugin.app.workspace.getActiveViewOfType(LocalTranscriptView);
            if (!view) return false;
            if (checking) return true;
            view.store.getState().toggleSearchBox();
          },
      }),
    ),
  );
}
