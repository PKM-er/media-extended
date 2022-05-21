export const enum Provider {
  obsidian = 1,
  html5,
  youtube,
  bilibili,
  vimeo,
  generalHost,
}

export type HostProviders = Exclude<
  Provider,
  Provider.obsidian | Provider.html5
>;
