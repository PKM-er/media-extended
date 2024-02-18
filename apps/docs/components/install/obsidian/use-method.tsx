import { useData } from "nextra/data";
import type { ObsidianInstallProps } from "./data";
import { useCallback, useEffect, useState } from "react";

function useHash() {
  const [hash, setHash] = useState("");

  const hashChangeHandler = useCallback(() => {
    setHash(window.location.hash.replace(/^#/, ""));
  }, []);

  useEffect(() => {
    hashChangeHandler();
    window.addEventListener("hashchange", hashChangeHandler);
    return () => {
      window.removeEventListener("hashchange", hashChangeHandler);
    };
  }, []);

  const updateHash = useCallback(
    (newHash: string) => {
      if (newHash !== hash) window.location.hash = newHash;
    },
    [hash]
  );

  return [hash, updateHash] as const;
}
const methods = ["obsidian", "brat", "manual"];
export function useMethods() {
  const { defaultMethod } = useData() as ObsidianInstallProps;

  const [hash, setHash] = useHash();

  const specifidInHash = methods.indexOf(hash);

  const onChange = useCallback(
    (index: number) => {
      setHash(methods[index]);
    },
    [setHash]
  );
  return [
    specifidInHash !== -1 ? specifidInHash : methods.indexOf(defaultMethod),
    onChange,
  ] as const;
}
