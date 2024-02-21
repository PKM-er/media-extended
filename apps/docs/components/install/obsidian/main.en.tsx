import { Tab, Tabs } from "nextra/components";
import ViaObsidian from "./obsidian.en.mdx";
import ViaBRAT from "./brat.en.mdx";
import Manual from "./manual.en.mdx";
import { useMethods } from "./use-method";

export default function ObsidianInstall() {
  const [selectedMethod, onChange] = useMethods();
  return (
    <Tabs
      items={["via Obsidian", "via BRAT", "Manual"]}
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
