import { useData } from "nextra/data";
import type { ObsidianInstallProps } from "./data";
import { Tab, Tabs } from "nextra/components";
import ViaObsidian from "./obsidian.zh-CN.mdx";
import ViaBRAT from "./brat.zh-CN.mdx";
import Manual from "./manual.zh-CN.mdx";


export default function ObsidianInstall() {
  const { defaultMethod } = useData() as ObsidianInstallProps;

  return (
    <Tabs
      items={["Obsidian", "BRAT", "手动"]}
      defaultIndex={
        defaultMethod === "obsidian" ? 0 : defaultMethod === "brat" ? 1 : 2
      }
    >
      <Tab>
        <ViaObsidian />
      </Tab>
      <Tab>
        <ViaBRAT />
      </Tab>
      <Tab>
        <Manual />
      </Tab>
    </Tabs>
  );
}
