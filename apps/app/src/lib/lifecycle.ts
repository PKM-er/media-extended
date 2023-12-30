export class LifeCycle {
  #events: (() => any)[] = [];
  #loaded = false;
  async load() {
    if (this.#loaded) return;
    this.#loaded = true;
    await this.onload();
  }
  async onload(): Promise<void> {
    return;
  }
  async unload() {
    if (!this.#loaded) return;
    this.#loaded = false;

    let unload;
    while ((unload = this.#events.pop())) {
      await unload();
    }
    await this.onunload();
  }
  async onunload(): Promise<void> {
    return;
  }
  register(e: () => any) {
    this.#events.push(e);
  }
  registerInterval(e: () => void, interval: number) {
    const id = setInterval(e, interval);
    this.register(() => clearInterval(id));
  }
  /**
   * Registers an DOM event to be detached when unloading
   * @public
   */
  registerDomEvent<K extends keyof WindowEventMap>(
    el: Window,
    type: K,
    callback: (this: HTMLElement, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  /**
   * Registers an DOM event to be detached when unloading
   * @public
   */
  registerDomEvent<K extends keyof DocumentEventMap>(
    el: Document,
    type: K,
    callback: (this: HTMLElement, ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  /**
   * Registers an DOM event to be detached when unloading
   * @public
   */
  registerDomEvent<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    type: K,
    callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  registerDomEvent(
    el: Window | HTMLElement | Document,
    type: string,
    callback: (this: HTMLElement, ev: Event) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    el.addEventListener(type, callback, options);
    this.register(() => el.removeEventListener(type, callback, options));
  }
}
