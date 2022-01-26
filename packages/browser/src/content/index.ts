import { HashTool, Player_TF } from "mx-lib";

const hashTool = new HashTool(window.location.hash),
  player = document.querySelector("video")!;
hashTool.initPlayer(player);
hashTool.applyAttrs(player);
console.log("media fragment ready");

window.addEventListener("hashchange", (evt) => {
  new HashTool(window.location.hash).setTimeSpan(
    player as unknown as Player_TF,
  );
});
