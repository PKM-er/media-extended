import { Tab, Tabs } from "nextra/components";
import ViaObsidian from "./obsidian.zh-CN.mdx";
import ViaBRAT from "./brat.zh-CN.mdx";
import Manual from "./manual.zh-CN.mdx";
import { useMethods } from "./use-method";

export default function ObsidianInstall() {
  const [selectedMethod, onChange] = useMethods();
  return (
    <Tabs
      items={["Obsidian", "BRAT", "手动"]}
      selectedIndex={selectedMethod}
      onChange={onChange}
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
