export abstract class LifeCycle {
  #events: (() => void)[] = [];
  #loaded = false;
  load() {
    if (this.#loaded) return;
    this.#loaded = true;
    this.onload();
  }
  abstract onload(): void;
  unload() {
    if (!this.#loaded) return;
    this.#loaded = false;

    let unload: (() => void) | undefined;
    while ((unload = this.#events.pop())) {
      unload();
    }
    this.onunload();
  }
  abstract onunload(): void;
  register(e: () => void) {
    this.#events.push(e);
  }
}
