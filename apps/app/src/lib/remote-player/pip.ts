import type { MediaContext } from "@vidstack/react";
import { Maverick } from "@vidstack/react";
import type { MsgCtrlLocal } from "./type";

const { onDispose } = Maverick;

/* eslint-disable @typescript-eslint/naming-convention */
export class WebpagePictureInPicture implements MediaPictureInPictureAdapter {
  constructor(
    protected _video: MsgCtrlLocal,
    private _media: MediaContext,
    private userGesture: () => Promise<void>,
  ) {
    onDispose(
      _video.on("enterpictureinpicture", (e) =>
        this._onChange(true, new Event(e.type)),
      ),
    );
    onDispose(
      _video.on("leavepictureinpicture", (e) =>
        this._onChange(false, new Event(e.type)),
      ),
    );
  }

  async updateActive() {
    const val = await this._video.methods.pictureInPictureEnabled();
    this.#active = val;
    return val;
  }
  #active = false;
  get active() {
    this.updateActive();
    return this.#active;
  }

  get supported() {
    return !!document.pictureInPictureEnabled;
  }

  async enter() {
    await this.userGesture();
    await this._video.methods.requestPictureInPicture();
  }

  async exit() {
    await this._video.methods.exitPictureInPicture();
  }

  private _onChange = (active: boolean, event: Event) => {
    this._media.delegate._notify("picture-in-picture-change", active, event);
  };
}

export interface MediaPictureInPictureAdapter {
  /**
   * Whether picture-in-picture mode is active.
   */
  readonly active: boolean;
  /**
   * Whether picture-in-picture mode is supported. This does not mean that the operation is
   * guaranteed to be successful, only that it can be attempted.
   */
  readonly supported: boolean;
  /**
   * Request to display the current provider in picture-in-picture mode.
   */
  enter(): Promise<void | PictureInPictureWindow>;
  /**
   * Request to display the current provider in inline by exiting picture-in-picture mode.
   */
  exit(): Promise<void>;
}
