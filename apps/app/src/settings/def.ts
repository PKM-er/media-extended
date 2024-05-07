/* eslint-disable @typescript-eslint/naming-convention */
import { assertNever } from "assert-never";
import type { PaneType } from "obsidian";
import { Notice, Platform, debounce, moment, normalizePath } from "obsidian";
import { createStore } from "zustand";
import type { URLMatchPattern } from "@/info/view-type";
import { vaildate } from "@/lib/lang/lang";
import { enumerate } from "@/lib/must-include";
import { pick, omit } from "@/lib/pick";
import type { RemoteMediaViewType } from "@/media-view/view-type";
import type MxPlugin from "@/mx-main";
import { BilibiliQuality } from "@/web/session/bilibili";

export type OpenLinkBehavior = false | PaneType | "split-horizontal" | null;

type MxSettingValues = {
  defaultVolume: number;
  urlMappingData: { appId: string; protocol: string; replace: string }[];
  devices: { appId: string; name: string }[];
  defaultMxLinkClick: {
    click: OpenLinkBehavior;
    alt: OpenLinkBehavior;
  };
  speedStep: number;
  enableSubtitle: boolean;
  defaultLanguage?: string;
  loadStrategy: "play" | "eager";
  linkHandler: Record<RemoteMediaViewType, URLMatchPattern[]>;
  timestampTemplate: string;
  screenshotTemplate: string;
  screenshotEmbedTemplate: string;
  insertBefore: boolean;
  /** in seconds */
  timestampOffset: number;
  biliDefaultQuality: BilibiliQuality;
  screenshotFormat: "image/png" | "image/jpeg" | "image/webp";
  screenshotQuality?: number;
  screenshotFolderPath?: string;
  subtitleFolderPath?: string;
};
const settingKeys = enumerate<keyof MxSettingValues>()(
  "defaultVolume",
  "urlMappingData",
  "devices",
  "defaultMxLinkClick",
  "linkHandler",
  "speedStep",
  "loadStrategy",
  "timestampTemplate",
  "screenshotTemplate",
  "screenshotEmbedTemplate",
  "insertBefore",
  "timestampOffset",
  "biliDefaultQuality",
  "screenshotFormat",
  "screenshotQuality",
  "enableSubtitle",
  "defaultLanguage",
  "screenshotFolderPath",
  "subtitleFolderPath",
);

const mxSettingsDefault = {
  defaultVolume: 80,
  urlMappingData: [],
  devices: [],
  defaultMxLinkClick: {
    click: "split",
    alt: "window",
  },
  linkHandler: {
    "mx-embed": [],
    "mx-url-audio": [],
    "mx-url-video": [],
    "mx-webpage": [],
  },
  enableSubtitle: false,
  loadStrategy: "eager",
  timestampTemplate: "\n- {{TIMESTAMP}} ",
  screenshotEmbedTemplate: "{{TITLE}}{{DURATION}}|50",
  screenshotTemplate: "\n- !{{SCREENSHOT}} {{TIMESTAMP}} ",
  insertBefore: false,
  timestampOffset: 0,
  biliDefaultQuality: BilibiliQuality.FHD,
  screenshotFormat: "image/webp",
  speedStep: 0.1,
} satisfies MxSettingValues;

function getDefaultDeviceName() {
  if (Platform.isDesktopApp) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("os").hostname() ||
      (Platform.isMacOS
        ? "Mac"
        : Platform.isWin
        ? "Windows"
        : Platform.isLinux
        ? "Linux"
        : "Desktop")
    );
  }
  if (Platform.isIosApp) {
    if (Platform.isPhone) return "iPhone";
    if (Platform.isTablet) return "iPad";
    return "iOS Device";
  }
  if (Platform.isAndroidApp) {
    if (Platform.isPhone) return "Android Phone";
    if (Platform.isTablet) return "Android Tablet";
    return "Android Device";
  }
  return "Unknown Device";
}

export type MxSettings = {
  setDefaultVolume: (volume: number) => void;
  getUrlMapping: (protocol: string) => string | undefined;
  setUrlMapping: (protocol: string, replace: string) => void;
  removeUrlMapping: (protocol: string) => void;
  getDeviceName: (id?: string) => string | undefined;
  getDeviceNameWithDefault: (id?: string) => string;
  setDeviceName: (label: string, id?: string) => void;
  setSpeedStep: (step: number) => void;
  setEnableSubtitle: (enable: boolean) => void;
  urlMapping: Map<string, string>;
  setTemplate: (
    key: "timestamp" | "screenshot" | "screenshotEmbed",
    value: string,
  ) => void;
  setScreenshotFormat: (
    format: "image/png" | "image/jpeg" | "image/webp",
  ) => void;
  setDefaultLanguage: (lang: string | null) => void;
  getDefaultLang(): string;
  setScreenshotQuality: (quality: number | null) => void;
  setTimestampOffset: (offset: number) => void;
  setInsertPosition: (pos: "before" | "after") => void;
  getUrlMappingData: () => MxSettingValues["urlMappingData"];
  setDefaultMxLinkBehavior: (click: OpenLinkBehavior) => void;
  setMxLinkAltBehavior: (click: OpenLinkBehavior) => void;
  setLinkHandler: (pattern: URLMatchPattern, type: RemoteMediaViewType) => void;
  setLoadStrategy: (strategy: "play" | "eager") => void;
  setBiliDefaultQuality: (quality: BilibiliQuality) => void;
  setScreenshotFolder: (path: string | null) => void;
  setSubtitleFolder: (path: string | null) => void;
  load: () => Promise<void>;
  save: () => void;
} & Omit<MxSettingValues, "urlMappingData">;

export function toUrlMap(data: MxSettingValues["urlMappingData"]) {
  return new Map(data.map((x) => [`${x.appId}%${x.protocol}`, x.replace]));
}
export function toUrlMappingData(data: MxSettings["urlMapping"]) {
  return Array.from(data.entries())
    .map(([key, replace]) => {
      const [appId, protocol] = key.split("%");
      return { appId, protocol, replace };
    })
    .filter((x) => x.appId && x.protocol && x.replace);
}

export function createSettingsStore(plugin: MxPlugin) {
  const save = debounce((_data: MxSettings) => {
    const data = pick(_data, settingKeys);
    plugin.saveData({
      ...data,
      urlMappingData: _data.getUrlMappingData(),
    } satisfies MxSettingValues);
  }, 1e3);
  return createStore<MxSettings>((set, get) => ({
    ...omit(mxSettingsDefault, ["urlMappingData"]),
    setEnableSubtitle(enable) {
      set({ enableSubtitle: enable });
      save(get());
    },
    setSpeedStep(step) {
      step = Math.abs(step);
      if (step === 0) return;
      set({ speedStep: step });
      save(get());
    },
    setScreenshotFormat(format) {
      set({ screenshotFormat: format });
      save(get());
    },
    setScreenshotQuality(quality) {
      set({ screenshotQuality: quality ?? undefined });
      save(get());
    },
    setDefaultLanguage(lang) {
      set({ defaultLanguage: lang?.format() });
      save(get());
    },
    getDefaultLang() {
      const userDefaultLang = get().defaultLanguage;
      const globalDefaultLang = moment.locale();
      if (userDefaultLang && !vaildate(userDefaultLang)) {
        new Notice(
          `Invalid language code detected in preferences: ${userDefaultLang}, reverting to ${globalDefaultLang}.`,
        );
        set({ defaultLanguage: undefined });
        save(get());
        return globalDefaultLang;
      }
      return userDefaultLang ?? moment.locale();
    },
    getUrlMappingData() {
      return toUrlMappingData(get().urlMapping);
    },
    setBiliDefaultQuality(quality) {
      set({ biliDefaultQuality: quality });
      save(get());
    },
    setInsertPosition(pos) {
      set({ insertBefore: pos === "before" });
      save(get());
    },
    setLinkHandler(pattern, type) {
      set((prev) => {
        const linkHandler = { ...prev.linkHandler };
        for (const k of Object.keys(linkHandler)) {
          const key = k as RemoteMediaViewType;
          // exclude the same pattern
          linkHandler[key] = linkHandler[key].filter((x) => {
            if (typeof x === "string") return x !== pattern;
            return typeof pattern === "string" || !compare(x, pattern);
          });
          if (key === type) {
            linkHandler[key] = [...linkHandler[key], pattern];
          }
        }
        return { linkHandler };
      });
      save(get());
    },
    setTimestampOffset(offset) {
      set({ timestampOffset: offset });
      save(get());
    },
    setDefaultMxLinkBehavior: (click) => {
      let alt: OpenLinkBehavior;
      if (click === "split" || click === "split-horizontal") alt = "window";
      else if (click === "window") alt = "tab";
      else if (click === "tab") alt = "split";
      else alt = null;
      set({ defaultMxLinkClick: { click, alt } });
      save(get());
    },
    setTemplate(key, value) {
      switch (key) {
        case "screenshot":
          set({ screenshotTemplate: value });
          break;
        case "screenshotEmbed":
          set({ screenshotEmbedTemplate: value });
          break;
        case "timestamp":
          set({ timestampTemplate: value });
          break;
        default:
          assertNever(key);
      }
      save(get());
    },
    setMxLinkAltBehavior: (click) => {
      set(({ defaultMxLinkClick }) => ({
        defaultMxLinkClick: { ...defaultMxLinkClick, alt: click },
      }));
      save(get());
    },
    urlMapping: toUrlMap(mxSettingsDefault.urlMappingData),
    setDefaultVolume: (volume: number) => {
      set({ defaultVolume: volume });
      save(get());
    },
    getUrlMapping: (protocol: string) => {
      return get().urlMapping.get(`${plugin.app.appId}%${protocol}`);
    },
    setUrlMapping: (protocol: string, replace: string) => {
      if (protocol.includes("%")) {
        throw new Error("Protocol cannot contain %");
      }
      const key = `${plugin.app.appId}%${protocol}`;
      set((prev) => ({
        urlMapping: new Map(prev.urlMapping).set(key, replace),
        devices: prev.getDeviceName()
          ? prev.devices
          : [
              ...prev.devices,
              { appId: plugin.app.appId, name: getDefaultDeviceName() },
            ],
      }));
      save(get());
    },
    removeUrlMapping: (protocol: string) => {
      if (protocol.includes("%")) {
        throw new Error("Protocol cannot contain %");
      }
      set((prev) => {
        const key = `${plugin.app.appId}%${protocol}`;
        const mapping = new Map(prev.urlMapping);
        mapping.delete(key);
        return { urlMapping: mapping };
      });
      save(get());
    },
    getDeviceName(id = plugin.app.appId) {
      return get().devices.find((x) => x.appId === id)?.name;
    },
    getDeviceNameWithDefault(id = plugin.app.appId) {
      const customLabel = get().devices.find((x) => x.appId === id);
      if (customLabel) return customLabel.name;
      if (id === plugin.app.appId) return getDefaultDeviceName();
      return "Unknown Device";
    },
    setDeviceName(label, id = plugin.app.appId) {
      set({
        devices: [
          ...get().devices.filter((x) => x.appId !== id),
          { appId: id, name: label },
        ],
      });
      save(get());
    },
    setLoadStrategy: (strategy) => {
      set({ loadStrategy: strategy });
      save(get());
    },
    setScreenshotFolder(path: string | null) {
      if (path !== null) {
        path = normalizePath(path);
        if (path === ".") {
          path = "/";
        } else if (path.startsWith("./")) {
          path = path.slice(2);
        }
        set({ screenshotFolderPath: path });
      } else {
        set({ screenshotFolderPath: undefined });
      }
    },
    setSubtitleFolder(path: string | null) {
      if (path !== null) {
        path = normalizePath(path);
        if (path === ".") {
          path = "/";
        } else if (path.startsWith("./")) {
          path = path.slice(2);
        }
        set({ subtitleFolderPath: path });
      } else {
        set({ subtitleFolderPath: undefined });
      }
    },
    load: async () => {
      const data: Partial<MxSettingValues> = await plugin.loadData();
      if (!data) return;
      const { urlMappingData, ...cfg } = pick(data, settingKeys);
      set({ ...cfg, urlMapping: toUrlMap(urlMappingData ?? []) });
    },
    save: () => {
      save(get());
    },
  }));
}

function compare(objA: Record<string, any>, objB: Record<string, any>) {
  const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);
  for (const key of keys) {
    if (objA[key] !== objB[key]) {
      return false;
    }
  }
  return true;
}
