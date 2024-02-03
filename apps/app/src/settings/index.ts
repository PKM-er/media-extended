import { type } from "arktype";
import { Notice, debounce, type Plugin } from "obsidian";
import { createStore } from "zustand";

const mxSettings = type({
  defaultVolume: "0<=integer<=100",
});
const mxSettingsDefault: typeof mxSettings.infer = {
  defaultVolume: 80,
};

export type MxSettings = typeof mxSettings.infer & {
  setDefaultVolume: (volume: number) => void;
  load: () => Promise<void>;
  save: () => void;
};

export function createSettingsStore(plugin: Plugin) {
  const save = debounce((data) => plugin.saveData(data), 1e3);
  return createStore<MxSettings>((set, get) => ({
    ...mxSettingsDefault,
    setDefaultVolume: (volume: number) => {
      set({ defaultVolume: volume });
      save(get());
    },
    load: async () => {
      const data: unknown = await plugin.loadData();
      if (!data) return;
      if (!check(data, "load")) return;
      set(data);
    },
    save: () => {
      const data = pick(
        get(),
        Object.keys(
          mxSettings.definition as any,
        ) as (keyof typeof mxSettings.infer)[],
      );
      if (!check(data, "save")) return;
      save(data);
    },
  }));
}

function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}

function check(
  settings: unknown,
  action: "save" | "load",
): settings is typeof mxSettings.infer {
  const validation = mxSettings(settings);
  if (validation.data) {
    return true;
  }
  const invaildKeys = Object.keys(validation.problems.byPath);
  new Notice(
    `Failed to ${action} media extended settings, see console for details` +
      "\n" +
      "Invaild keys: " +
      invaildKeys.join(", "),
  );
  console.error("Invaild config: ", settings);
  console.error("Invaild keys: ", invaildKeys);
  console.error("Problems: ", validation.problems.summary);
  console.error(validation.problems);
  return false;
}
