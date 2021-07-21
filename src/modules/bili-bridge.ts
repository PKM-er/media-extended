import { App, Setting } from "obsidian";

export const isAvailable = (app: App): boolean =>
  // @ts-ignore
  app.plugins.plugins["mx-bili-plugin"] !== undefined;

export const getPort = (app: App): number => {
  // @ts-ignore
  const bili = app.plugins.plugins["mx-bili-plugin"];
  if (!isAvailable(app)) throw new Error("bili plugin not available");
  else return bili.settings.port;
};

export const getPortSetting = (
  app: App,
): ((containerEl: HTMLElement) => Setting) => {
  // @ts-ignore
  const bili = app.plugins.plugins["mx-bili-plugin"];
  if (!isAvailable(app)) throw new Error("bili plugin not available");
  else return bili.portSetting;
};

type func = (...args: [aid: number] | [bvid: string]) => Promise<string | null>;

export const fetchPosterFunc = (app: App): func => {
  // @ts-ignore
  const bili = app.plugins.plugins["mx-bili-plugin"];
  if (!isAvailable(app)) throw new Error("bili plugin not available");
  else return bili.fetchPoster;
};
