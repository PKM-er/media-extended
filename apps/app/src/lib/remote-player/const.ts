export const GET_PORT_TIMEOUT = 5e3;

export const PORT_MESSAGE = "mx-port";
export const PORT_READY_MESSAGE = "mx-port-ready";

declare module "obsidian" {
  interface App {
    appId: string;
  }
}

const disablePartition =
  localStorage.getItem("MX_DEV_DISABLE_PARTITION") === "1";
if (disablePartition) {
  console.log("DEV: disable partition");
}

export const getPartition = disablePartition
  ? () => undefined
  : (id: string) => `persist:mx-player-${id}`;
