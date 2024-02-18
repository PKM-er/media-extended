import { Tab, Tabs } from "nextra/components";
import ViaObsidian from "./obsidian.en-US.mdx";
import ViaBRAT from "./brat.en-US.mdx";
import Manual from "./manual.en-US.mdx";
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
