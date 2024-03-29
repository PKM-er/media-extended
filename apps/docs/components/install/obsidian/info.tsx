import { Callout } from "nextra/components";
import { useData } from "nextra/data";
import type { ObsidianInstallProps } from "./data";
import LatestBadge, { releaseUrl } from "../latest-badge";
import Versions from "../version";

type Channel = "main" | "beta";

interface InfoLabels {
  latest: string;
  required: string;
}

const infoLabels = {
  en: {
    required: "Required Obsidian Version:",
    latest: "Latest Version:",
  },
  "zh-CN": {
    required: "最低 Obsidian 版本：",
    latest: "插件最新版本：",
  },
} satisfies Record<string, InfoLabels>;

type InfoLanguage = keyof typeof infoLabels;

export const ObsidianInfo = ({
  channel = "main",
  lang,
}: {
  channel?: Channel[] | Channel;
  lang: InfoLanguage;
}) => {
  const props = useData() as ObsidianInstallProps;

  const info = (() => {
    for (const c of Array.isArray(channel) ? channel : [channel]) {
      if (props[c]) return props[c];
    }
    return null;
  })();
  if (!info) return <Callout type="info">Not yet Available</Callout>;
  const { requireObsdian, version } = info;
  return (
    <Callout type="info">
      <div>
        {infoLabels[lang].latest}
        <Versions values={[version]} />
      </div>
      <div>
        {infoLabels[lang].required}
        <Versions values={[requireObsdian]} />
      </div>
    </Callout>
  );
};

export function ViaObsidianInfo({ lang }: { lang: InfoLanguage }) {
  const { enlisted } = useData() as ObsidianInstallProps;
  if (!enlisted) {
    return <Callout type="error">Not yet Available</Callout>;
  }
  return <ObsidianInfo lang={lang} />;
}

const toDownloadLink = (file: string, ver: string | null = null) => {
  if (ver === "latest") {
    return `${releaseUrl}/latest/download/${file}`;
  } else if (ver) {
    return `${releaseUrl}/download/${ver}/${file}`;
  } else {
    return releaseUrl;
  }
};

export const ReleaseLink = () => {
  const { main: mainManifest, beta: betaManifest } =
    useData() as ObsidianInstallProps;

  const manifest = mainManifest ?? betaManifest;
  return (
    <LatestBadge
      href={toDownloadLink("media-extended.zip", manifest?.version)}
      newPage
    />
  );
};
