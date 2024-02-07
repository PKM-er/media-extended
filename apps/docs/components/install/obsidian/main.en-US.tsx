import { useData } from "nextra/data";
import type { ObsidianInstallProps } from "./data";
import { Tab, Tabs } from "nextra/components";
import ViaObsidian from "./obsidian.en-US.mdx";
import ViaBRAT from "./brat.en-US.mdx";
import Manual from "./manual.en-US.mdx";


export default function ObsidianInstall() {
  const { defaultMethod } = useData() as ObsidianInstallProps;

  return (
    <Tabs
      items={["via Obsidian", "via BRAT", "Manual"]}
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
