export const ChannelNameObsidian = "mx-provide-obsidian-channel";
export const ChannelNameBrowserView = "mx-provide-view-channel";

/**
 * @returns function to send port to browser view
 */
const createChannel = (
  win: Electron.WebContents,
  view: Electron.WebContents,
  MessageChannelMain: typeof Electron.MessageChannelMain,
): (() => void) => {
  const { port1: portOb, port2: portView } = new MessageChannelMain();
  win.postMessage(ChannelNameObsidian, view.id, [portOb]);
  return () => view.postMessage(ChannelNameBrowserView, null, [portView]);
};

export default createChannel;
