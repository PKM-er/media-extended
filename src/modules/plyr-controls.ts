import "../style/plyr-controls.css";

import MediaExtended from "../mx-main";

export type PlyrControls =
  | "restart"
  | "rewind"
  | "play"
  | "fast-forward"
  | "mute"
  | "volume"
  | "captions"
  | "settings"
  | "pip"
  | "fullscreen"
  | "current-time"
  | "duration"
  | "progress";

type IdHint = [id: string, hint: string];
const map = new Map<PlyrControls, IdHint>([
  ["restart", ["restart", "Restart"]],
  ["rewind", ["rewind", "Rewind"]],
  ["play", ["play", "Play/Pause"]],
  ["fast-forward", ["fast-forward", "Fast forward"]],
  ["mute", ["muted", "Mute"]],
  ["volume", ["volume", "Volume bar"]],
  ["captions", ["captions-on", "Caption"]],
  ["settings", ["settings", "Control speed/ select captions..."]],
  ["pip", ["pip", "Picture-in-Picture"]],
  ["fullscreen", ["enter-fullscreen", "Fullscreen"]],
  ["current-time", ["current-time", "Current time"]],
  ["duration", ["duration", "Duration"]],
]);
const createButton = (
  hint: string,
  o?: DomElementInfo,
  callback?: (el: HTMLButtonElement) => void,
) =>
  createEl(
    "button",
    {
      cls: ["plyr__control"],
      type: "button",
      attr: { "aria-label": hint },
      ...o,
    },
    callback,
  );
const createPlyrButton = (
  id: PlyrControls,
  hint: string,
  o?: DomElementInfo,
  callback?: (el: HTMLButtonElement) => void,
) => {
  const hrefId = map.get(id);
  if (!hrefId) throw new Error("Invaild id");

  return createButton(hint, o, (button) => {
    button.insertAdjacentHTML(
      "beforeend",
      `<svg aria-hidden="true" focusable="false"><use xlink:href="#plyr-${hrefId[0]}"></use></svg>`,
    );
    if (callback) callback(button);
  });
};

export class PlyrControlsSetting {
  plugin: MediaExtended;
  containerEl: HTMLElement;
  buttonMap = new WeakMap<HTMLButtonElement, PlyrControls>();
  regularContainer: HTMLDivElement;
  progressContainer: HTMLDivElement;
  get plyrControls() {
    return this.plugin.settings.plyrControls;
  }

  constructor(containerEl: HTMLElement, plugin: MediaExtended) {
    this.plugin = plugin;
    this.containerEl = containerEl;
    this.regularContainer = this.containerEl.createDiv({
      cls: "plyr-controls-settings plyr__controls",
    });
    this.progressContainer = this.containerEl.createDiv(
      { cls: "plyr-controls-settings plyr__controls plyr-progress-setting" },
      (div) =>
        div.createEl("input", {
          type: "range",
          attr: { disabled: true },
        }),
    );
    this.addControls();
    this.containerEl.on("click", "button", (ev) => {
      let id: PlyrControls | undefined;
      const button = ev.target as HTMLButtonElement;
      if ((id = this.buttonMap.get(button))) {
        const changeTo = !this.plyrControls[id];
        this.plyrControls[id] = changeTo;
        this.plugin.saveData(this.plugin.settings);
        button.toggleClass("checked", changeTo);
      } else {
        console.error("unknown click target: %o", ev.target);
      }
    });
  }

  addControls() {
    const setChecked = (el: HTMLElement, id: PlyrControls) =>
      el.toggleClass("checked", this.plyrControls[id]);

    map.forEach(([, hint], id) => {
      if (id === "current-time") {
        this.buttonMap.set(
          this.progressContainer.appendChild(
            createButton(
              hint,
              {
                cls: "plyr__controls__item plyr__time--current plyr__time",
                text: "05:00",
              },
              (el) => setChecked(el, id),
            ),
          ),
          "current-time",
        );
      } else if (id === "duration") {
        this.buttonMap.set(
          this.progressContainer.appendChild(
            createButton(
              hint,
              {
                cls: "plyr__controls__item plyr__time--duration plyr__time",
                text: "10:00",
              },
              (el) => setChecked(el, id),
            ),
          ),
          id,
        );
      } else {
        this.buttonMap.set(
          this.regularContainer.appendChild(
            createPlyrButton(id, hint, {}, (el) => setChecked(el, id)),
          ),
          id,
        );
      }
    });
  }
}
