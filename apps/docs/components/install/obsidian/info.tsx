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

export const ObsidianInfo = ({
  channel = "main",
  labels,
}: {
  channel?: Channel[] | Channel;
  labels: InfoLabels;
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
        {labels.latest}
        <Versions values={[version]} />
      </div>
      <div>
        {labels.required}
        <Versions values={[requireObsdian]} />
      </div>
    </Callout>
  );
};

export function ViaObsidianInfo({ labels }: { labels: InfoLabels }) {
  const { enlisted } = useData() as ObsidianInstallProps;
  if (!enlisted) {
    return <Callout type="error">Not yet Available</Callout>;
  }
  return <ObsidianInfo labels={labels} />;
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
