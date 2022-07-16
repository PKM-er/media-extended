import {
  dispatch,
  RootState,
  Selectors,
  Slices,
  subscribe,
} from "mx-user-script";

import {
  SettingButtonCls,
  SettingMenuToggleCls,
  WebFscreenClass,
} from "./common";

const inputChangeEvent = new Event("change");

const {
  selectAutoplay,
  selectBiliWebFscreen,
  selectDanmaku,
  selectFscreen,
  selectLoop,
} = Selectors;
const {
  applyParentFullscreen,
  enterWebFscreen,
  handleAutoplayChange,
  handleDanmakuChange,
  handleLoopChange,
  handleWebFscreenChange,
} = Slices;

const hookInputButton = (
  findIn: HTMLElement,
  classname: string,
  selector: (state: RootState) => boolean | null | undefined,
  action: (payload: boolean) => Parameters<typeof dispatch>[0],
) => {
  const checkbox = findIn.querySelector<HTMLInputElement>(
    `.${classname} input[type="checkbox"]`,
  );
  if (checkbox) {
    checkbox.addEventListener("change", (evt) => {
      if (evt !== inputChangeEvent) {
        dispatch(action(checkbox.checked));
      }
    });
    subscribe(selector, (toggle) => {
      if (
        toggle !== null &&
        toggle !== undefined &&
        checkbox.checked !== toggle
      ) {
        checkbox.checked = toggle;
        checkbox.dispatchEvent(inputChangeEvent);
      }
    });
  }
};

const observeClass = (
  el: HTMLElement,
  classname: string,
  onChange: (exist: boolean) => any,
) => {
  let prevClass: string[] = [];
  const modeObs = new MutationObserver(() => {
    const newClass = [...document.body.classList.values()];
    const isPrevExist = prevClass.includes(classname),
      isNowExist = newClass.includes(classname);
    if (isPrevExist !== isNowExist) {
      onChange(isNowExist);
    }
    prevClass = newClass;
  });
  modeObs.observe(el, { attributeFilter: ["class"] });
};

const hookWebFscreenState = () => {
  const ref = window.__PLAYER_REF__;
  // on web fscreen change
  observeClass(document.body, WebFscreenClass, (fullscreen) => {
    dispatch(handleWebFscreenChange(fullscreen));
  });

  // apply web fscreen state
  const button = ref.controls!.querySelector<HTMLInputElement>(
    `.${SettingButtonCls.webFullscreen}`,
  )!;

  subscribe(
    selectBiliWebFscreen,
    (fullscreen) => {
      if (fullscreen !== null) setWebFscreen(fullscreen, button);
    },
    true, // by default, will enter web fullscreen
  );

  // applyParentFullscreen
  subscribe(selectFscreen, (fullscreen) => {
    fullscreen && dispatch(applyParentFullscreen());
  });
};

const setWebFscreen = (fullscreen: boolean, button: HTMLElement) => {
  let tries = 0;
  const interval = setInterval(() => {
    if (tries > 10) {
      console.log("failed to webfs");
      window.clearInterval(interval);
    }
    if (fullscreen !== document.body.classList.contains(WebFscreenClass)) {
      button.click();
      console.log("webfs button clicked");
    } else {
      window.clearInterval(interval);
      console.log("webfs applied, exiting");
    }
    tries++;
  }, 200);
};

export const hookBilibiliControls = () => {
  const ref = window.__PLAYER_REF__;
  hookInputButton(
    ref.settingsMenuWarp!,
    SettingMenuToggleCls.autoplay,
    selectAutoplay,
    handleAutoplayChange,
  );
  hookInputButton(
    ref.settingsMenuWarp!,
    SettingMenuToggleCls.repeat,
    selectLoop,
    handleLoopChange,
  );
  // danmaku toggle
  hookInputButton(
    ref.playerContainer!,
    "bilibili-player-video-danmaku-switch",
    selectDanmaku,
    handleDanmakuChange,
  );
  hookWebFscreenState();
  hookDanmakuButton();
};

const hookDanmakuButton = () => {
  const findIn = window.__PLAYER_REF__.playerContainer!;

  subscribe(selectDanmaku, (danmaku) => {
    if (danmaku === null) return;
    let tries = 0;
    const interval = window.setInterval(() => {
      if (tries > 10) {
        window.clearInterval(interval);
        console.error("danmaku button not found");
        return;
      }
      const checkbox = findIn.querySelector<HTMLInputElement>(
        '.bilibili-player-video-danmaku-switch input[type="checkbox"]',
      );
      if (!checkbox) {
        tries++;
      } else {
        checkbox.checked = danmaku;
        checkbox.dispatchEvent(inputChangeEvent);
        console.log("danmaiku button set to", danmaku);
        window.clearInterval(interval);
      }
    }, 200);
  });
};
