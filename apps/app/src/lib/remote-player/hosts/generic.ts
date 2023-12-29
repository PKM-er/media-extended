import type { CommRemote } from "@/lib/remote-player/type";
import { waitForSelector } from "@/lib/remote-player/utils/wait-el";
import { bindPlayer } from "../bind";

await Promise.all([
  waitForSelector<HTMLVideoElement>("video"),
  MX_MESSAGE as Promise<CommRemote>,
]).then(async ([player, port]) => {
  bindPlayer(player, port);
});
