// @ts-nocheck
import "../style/plyr-controls.less";

import type MediaExtended from "@plugin";

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

type IconHint = [svg: string, hint: string];
const map = new Map<PlyrControls, IconHint>([
  [
    "restart",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-restart" viewBox="0 0 18 18"><path d="M9.7 1.2l.7 6.4 2.1-2.1c1.9 1.9 1.9 5.1 0 7-.9 1-2.2 1.5-3.5 1.5-1.3 0-2.6-.5-3.5-1.5-1.9-1.9-1.9-5.1 0-7 .6-.6 1.4-1.1 2.3-1.3l-.6-1.9C6 2.6 4.9 3.2 4 4.1 1.3 6.8 1.3 11.2 4 14c1.3 1.3 3.1 2 4.9 2 1.9 0 3.6-.7 4.9-2 2.7-2.7 2.7-7.1 0-9.9L16 1.9l-6.3-.7z"></path></svg>`,
      "Restart",
    ],
  ],
  [
    "rewind",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-rewind" viewBox="0 0 18 18"><path d="M10.125 1L0 9l10.125 8v-6.171L18 17V1l-7.875 6.171z"></path></svg>`,
      "Rewind",
    ],
  ],
  [
    "play",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-play" viewBox="0 0 18 18"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg>`,
      "Play/Pause",
    ],
  ],
  [
    "fast-forward",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-fast-forward" viewBox="0 0 18 18"><path d="M7.875 7.171L0 1v16l7.875-6.171V17L18 9 7.875 1z"></path></svg>`,
      "Fast forward",
    ],
  ],
  [
    "mute",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-muted" viewBox="0 0 18 18"><path d="M12.4 12.5l2.1-2.1 2.1 2.1 1.4-1.4L15.9 9 18 6.9l-1.4-1.4-2.1 2.1-2.1-2.1L11 6.9 13.1 9 11 11.1zM3.786 6.008H.714C.286 6.008 0 6.31 0 6.76v4.512c0 .452.286.752.714.752h3.072l4.071 3.858c.5.3 1.143 0 1.143-.602V2.752c0-.601-.643-.977-1.143-.601L3.786 6.008z"></path></svg>`,
      "Mute",
    ],
  ],
  [
    "volume",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-volume" viewBox="0 0 18 18"><path d="M15.6 3.3c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4C15.4 5.9 16 7.4 16 9c0 1.6-.6 3.1-1.8 4.3-.4.4-.4 1 0 1.4.2.2.5.3.7.3.3 0 .5-.1.7-.3C17.1 13.2 18 11.2 18 9s-.9-4.2-2.4-5.7z"></path><path d="M11.282 5.282a.909.909 0 000 1.316c.735.735.995 1.458.995 2.402 0 .936-.425 1.917-.995 2.487a.909.909 0 000 1.316c.145.145.636.262 1.018.156a.725.725 0 00.298-.156C13.773 11.733 14.13 10.16 14.13 9c0-.17-.002-.34-.011-.51-.053-.992-.319-2.005-1.522-3.208a.909.909 0 00-1.316 0zm-7.496.726H.714C.286 6.008 0 6.31 0 6.76v4.512c0 .452.286.752.714.752h3.072l4.071 3.858c.5.3 1.143 0 1.143-.602V2.752c0-.601-.643-.977-1.143-.601L3.786 6.008z"></path></svg>`,
      "Volume bar",
    ],
  ],
  [
    "captions",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-captions-on" viewBox="0 0 18 18"><path d="M1 1c-.6 0-1 .4-1 1v11c0 .6.4 1 1 1h4.6l2.7 2.7c.2.2.4.3.7.3.3 0 .5-.1.7-.3l2.7-2.7H17c.6 0 1-.4 1-1V2c0-.6-.4-1-1-1H1zm4.52 10.15c1.99 0 3.01-1.32 3.28-2.41l-1.29-.39c-.19.66-.78 1.45-1.99 1.45-1.14 0-2.2-.83-2.2-2.34 0-1.61 1.12-2.37 2.18-2.37 1.23 0 1.78.75 1.95 1.43l1.3-.41C8.47 4.96 7.46 3.76 5.5 3.76c-1.9 0-3.61 1.44-3.61 3.7 0 2.26 1.65 3.69 3.63 3.69zm7.57 0c1.99 0 3.01-1.32 3.28-2.41l-1.29-.39c-.19.66-.78 1.45-1.99 1.45-1.14 0-2.2-.83-2.2-2.34 0-1.61 1.12-2.37 2.18-2.37 1.23 0 1.78.75 1.95 1.43l1.3-.41c-.28-1.15-1.29-2.35-3.25-2.35-1.9 0-3.61 1.44-3.61 3.7 0 2.26 1.65 3.69 3.63 3.69z" fill-rule="evenodd"></path></svg>`,
      "Caption",
    ],
  ],
  [
    "settings",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-settings" viewBox="0 0 18 18"><path d="M16.135 7.784a2 2 0 01-1.23-2.969c.322-.536.225-.998-.094-1.316l-.31-.31c-.318-.318-.78-.415-1.316-.094a2 2 0 01-2.969-1.23C10.065 1.258 9.669 1 9.219 1h-.438c-.45 0-.845.258-.997.865a2 2 0 01-2.969 1.23c-.536-.322-.999-.225-1.317.093l-.31.31c-.318.318-.415.781-.093 1.317a2 2 0 01-1.23 2.969C1.26 7.935 1 8.33 1 8.781v.438c0 .45.258.845.865.997a2 2 0 011.23 2.969c-.322.536-.225.998.094 1.316l.31.31c.319.319.782.415 1.316.094a2 2 0 012.969 1.23c.151.607.547.865.997.865h.438c.45 0 .845-.258.997-.865a2 2 0 012.969-1.23c.535.321.997.225 1.316-.094l.31-.31c.318-.318.415-.781.094-1.316a2 2 0 011.23-2.969c.607-.151.865-.547.865-.997v-.438c0-.451-.26-.846-.865-.997zM9 12a3 3 0 110-6 3 3 0 010 6z"></path></svg>`,
      "Control speed/ select captions...",
    ],
  ],
  [
    "pip",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-settings" viewBox="0 0 18 18"><path d="M16.135 7.784a2 2 0 01-1.23-2.969c.322-.536.225-.998-.094-1.316l-.31-.31c-.318-.318-.78-.415-1.316-.094a2 2 0 01-2.969-1.23C10.065 1.258 9.669 1 9.219 1h-.438c-.45 0-.845.258-.997.865a2 2 0 01-2.969 1.23c-.536-.322-.999-.225-1.317.093l-.31.31c-.318.318-.415.781-.093 1.317a2 2 0 01-1.23 2.969C1.26 7.935 1 8.33 1 8.781v.438c0 .45.258.845.865.997a2 2 0 011.23 2.969c-.322.536-.225.998.094 1.316l.31.31c.319.319.782.415 1.316.094a2 2 0 012.969 1.23c.151.607.547.865.997.865h.438c.45 0 .845-.258.997-.865a2 2 0 012.969-1.23c.535.321.997.225 1.316-.094l.31-.31c.318-.318.415-.781.094-1.316a2 2 0 011.23-2.969c.607-.151.865-.547.865-.997v-.438c0-.451-.26-.846-.865-.997zM9 12a3 3 0 110-6 3 3 0 010 6z"></path></svg>`,
      "Picture-in-Picture",
    ],
  ],
  [
    "fullscreen",
    [
      `<svg aria-hidden="true" focusable="false" id="plyr-enter-fullscreen" viewBox="0 0 18 18"><path d="M10 3h3.6l-4 4L11 8.4l4-4V8h2V1h-7zM7 9.6l-4 4V10H1v7h7v-2H4.4l4-4z"></path></svg>`,
      "Fullscreen",
    ],
  ],
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
    button.insertAdjacentHTML("beforeend", hrefId[0]);
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
    return this.plugin.sizeSettings.plyrControls;
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
        this.plugin.saveSettings();
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

export const recToPlyrControls = (rec: Record<PlyrControls, boolean>) =>
  ([...Object.entries(rec)] as [PlyrControls, boolean][])
    .filter((v) => v[1])
    .map((v) => v[0]);
