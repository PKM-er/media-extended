import { createContext, useContext } from "react";
import { useStore, type StoreApi } from "zustand";
import type MxPlugin from "@/mx-main";
import type { MxSettings } from "./def";

export const SettingContext = createContext<{
  settings: StoreApi<MxSettings>;
  plugin: MxPlugin;
}>(null as any);

export function useSettings<U>(selector: (state: MxSettings) => U): U {
  const { settings } = useContext(SettingContext);
  // eslint-disable-next-line import/no-deprecated -- don't use equalityFn here
  return useStore(settings, selector);
}

export function useAppId() {
  return useContext(SettingContext).plugin.app.appId;
}
