import { Notice } from "obsidian";

export function noticeNotetaking(action: string) {
  const label = "mx:media-notetaking-notified";
  const notified = localStorage.getItem(label);
  if (notified) return;
  new Notice(
    createFragment((e) => {
      e.appendText(
        `You are taking ${action} from media player. By default, they will only be saved in the media note. `,
      );
      e.createEl("p", {
        text: `To take ${action} or control playback from abritrary note, use command when focused on the note`,
      });
      e.createEl("p", {
        text: "PS: you can assign a hotkey to each command in the settings",
      });
      e.appendText("Click to dismiss this notice.");
    }),
    0,
  );
  localStorage.setItem(label, "1");
}
