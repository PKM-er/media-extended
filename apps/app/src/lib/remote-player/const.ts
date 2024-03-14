export const GET_PORT_TIMEOUT = 5e3;

export const PORT_MESSAGE = "mx-port";
export const PORT_READY_MESSAGE = "mx-port-ready";

declare module "obsidian" {
  interface App {
    appId: string;
  }
}

export const getPartition = (id: string) => `persist:mx-player-${id}`;
