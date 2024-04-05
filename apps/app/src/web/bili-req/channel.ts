export function channelId(storeId: string) {
  return {
    enable: `mx-enable-preload-${storeId}`,
    disable: `mx-disable-preload-${storeId}`,
    preload: `file:///mx-preload-${storeId}`,
  };
}
