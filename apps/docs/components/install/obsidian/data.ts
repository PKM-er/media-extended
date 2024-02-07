export const getDefaultMethod = (
  detailsFromEnlisted: any,
  betaManifest: any
): "brat" | "obsidian" | "manual" => {
  if (detailsFromEnlisted) return "obsidian";
  if (betaManifest) return "brat";
  return "manual";
};

export async function getSSGProps(): Promise<ObsidianInstallProps> {
  const [enlisted, mainManifest, betaManifest] = await Promise.all(
    [
      "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/community-plugins.json",
      "https://raw.githubusercontent.com/PKM-er/media-extended/main/manifest.json",
      `https://raw.githubusercontent.com/PKM-er/media-extended/main/manifest-beta.json`,
    ].map(async (url): Promise<Record<string, any> | null> => {
        return await fetch(url).then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              console.log(`${url}: Not found`);
              return null;}
            throw new Error(`Failed to fetch ${url}: ${res.status}`);
          }
          return res.json();
        });
    })
  );

  const detailsFromEnlisted =
    enlisted && Array.isArray(enlisted)
      ? enlisted.find((plugin) => plugin.id === "media-extended")
      : null;

  return {
    defaultMethod: getDefaultMethod(detailsFromEnlisted, betaManifest),
    enlisted: !!detailsFromEnlisted,
    main: mainManifest && {
      requireObsdian: mainManifest.minAppVersion,
      version: mainManifest.version,
    },
    beta: betaManifest && {
      requireObsdian: betaManifest.minAppVersion,
      version: betaManifest.version,
    },
  };
}

export interface ObsidianInstallProps {
  defaultMethod: "brat" | "obsidian" | "manual";
  enlisted: boolean;
  main: {
    requireObsdian: string;
    version: string;
  } | null;
  beta: {
    requireObsdian: string;
    version: string;
  } | null;
}
