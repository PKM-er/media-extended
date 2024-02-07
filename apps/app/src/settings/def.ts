import { Platform, debounce } from "obsidian";
import { createStore } from "zustand";
import { enumerate } from "@/lib/must-include";
import type MxPlugin from "@/mx-main";

type MxSettingValues = {
  defaultVolume: number;
  urlMappingData: { appId: string; protocol: string; replace: string }[];
  devices: { appId: string; name: string }[];
};
const settingKeys = enumerate<keyof MxSettingValues>()(
  "defaultVolume",
  "urlMappingData",
  "devices",
);

const mxSettingsDefault = {
  defaultVolume: 80,
  urlMappingData: [],
  devices: [],
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
  urlMapping: Map<string, string>;
  getUrlMappingData: () => MxSettingValues["urlMappingData"];
  devices: MxSettingValues["devices"];
  defaultVolume: number;
  load: () => Promise<void>;
  save: () => void;
};

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
    getUrlMappingData() {
      return toUrlMappingData(get().urlMapping);
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

function pick<T extends Record<string, unknown>, K extends string>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}
function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
