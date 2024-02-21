import type { Unsubscribe } from "nanoevents";
import { createEventEmitter } from "@/lib/emitter";
import type { InvokeMessage, InvokeRespMessage } from "./type";
import {
  NoHanlderError,
  PORT_READY_EVENT,
  genRequsetMessage,
  genSentMessage,
  isInvokeMessage,
  isInvokeRespMessage,
  isSentMessage,
} from "./type";

type ActionResult = {
  value: any;
  transfer?: Transferable[];
} | void;

interface MessageControllerEvents {
  resp: (id: string, value: any, err: InvokeRespMessage["error"]) => void;
  ready: () => void;
  [event: `send:${string}`]: (payload: EventPayload) => void;
}

type InvokeOptions = Partial<{ transfer?: Transferable[]; timeout?: number }>;

export type Nil = Record<string, never>;

export type EventPayload<T extends string = string, V = any> = {
  type: T;
  payload: V;
};

export class MessageController<
  InvokeHandlers extends Record<
    string,
    (...args: any[]) => ActionResult | PromiseLike<ActionResult>
  > = Nil,
  Methods extends Record<string, (...args: any[]) => any> = Nil,
  SendHandlers extends Record<string, any> = Nil,
  Sends extends Record<string, any> = Nil,
> {
  private port: MessagePort | null = null;

  load(port: MessagePort) {
    if (this.port) {
      this.port.close();
    }
    this.port = port;
    const onMessage = ({ data }: MessageEvent) => {
      this.onMessage(data);
    };
    port.addEventListener("message", onMessage);
    port.start();
    port.postMessage(PORT_READY_EVENT);
  }
  unload() {
    this.port?.close();
    this.emitter.events = {};
  }

  private actions: Record<
    string,
    (...args: any[]) => ActionResult | PromiseLike<ActionResult>
  > = Object.create(null);
  private emitter = createEventEmitter<MessageControllerEvents>();

  private onMessage(data: unknown) {
    if (data === PORT_READY_EVENT) {
      this.emitter.emit("ready");
    } else if (isInvokeMessage(data)) {
      this.response(data);
    } else if (isInvokeRespMessage(data)) {
      this.emitter.emit("resp", data.id, data.payload, data.error);
    } else if (isSentMessage(data)) {
      this.emitter.emit(`send:${data.send}`, {
        type: data.send,
        payload: data.payload,
      });
    }
  }

  // prop "methods", a Proxy object that implicitly calls invoke function
  // when a property is accessed and invoke the property name as action name
  methods = new Proxy({} as Record<string, (...args: any[]) => Promise<any>>, {
    get: (obj, prop) => {
      // don't access the property if it's a symbol
      if (typeof prop === "symbol")
        throw new Error("Remote invoke does not support symbol property");
      return (obj[prop] ??= (...args: any[]) =>
        this.invoke(prop.toString(), args));
    },
  }) as {
    [K in keyof Methods]: (
      ...args: Parameters<Methods[K]>
    ) => Promise<Awaited<ReturnType<Methods[K]>>>;
  };

  invoke(
    action: string,
    args: any[],
    { transfer, timeout = 1e3 }: InvokeOptions = {},
  ) {
    if (!this.port) throw new Error("port not loaded");

    const message = genRequsetMessage(action, ...args);
    this.port.postMessage(message, { transfer });
    return new Promise<any>((resolve, reject) => {
      let timeoutId = -1;
      const unload = this.emitter.on("resp", (id, value, err) => {
        if (id !== message.id) return;
        unload();
        window.clearTimeout(timeoutId);
        if (err) {
          const { message, stack } = err;
          const error = new Error(message);
          error.stack = stack;
          reject(error);
        } else {
          resolve(value);
        }
      });
      if (timeout > 0 && timeout < Infinity) {
        timeoutId = window.setTimeout(() => {
          unload();
          console.error(`${action} timeout after ${timeout}ms`);
          reject(new TimeoutError(timeout));
        }, timeout);
      }
    });
  }

  handle<A extends keyof InvokeHandlers>(
    action: A,
    callback: (
      ...args: Parameters<InvokeHandlers[A]>
    ) =>
      | Promise<Awaited<ReturnType<InvokeHandlers[A]>>>
      | Awaited<ReturnType<InvokeHandlers[A]>>,
  ): void;
  handle(action: string, callback: (...args: any[]) => any): void {
    this.actions[action] = callback;
  }

  send<A extends keyof Sends>(
    action: A,
    payload: Sends[A],
    transfer?: Transferable[],
  ): void;
  send(action: string, payload?: any, transfer?: Transferable[]): void {
    if (!this.port) throw new Error("port not loaded");
    const message = genSentMessage(action, payload);
    this.port.postMessage(message, { transfer });
  }

  on<A extends keyof SendHandlers>(
    event: A,
    callback: (payload: { type: A; payload: SendHandlers[A] }) => void,
  ): Unsubscribe;
  on(event: string, callback: (payload: EventPayload) => void): Unsubscribe {
    const unload = this.emitter.on(`send:${event}`, callback);
    return unload;
  }

  once<A extends keyof SendHandlers>(
    event: A,
    callback: (payload: SendHandlers[A]) => void,
  ): Unsubscribe;
  once(event: string, callback: (payload: any) => void): Unsubscribe {
    const unload = this.emitter.once(`send:${event}`, callback);
    return unload;
  }
  onReady(
    callback: () => void,
    { once = false }: { once?: boolean; timeout?: number } = {},
  ) {
    const unload = once
      ? this.emitter.once("ready", callback)
      : this.emitter.on("ready", callback);
    return unload;
  }

  private async response({ id, invoke: type, args = [] }: InvokeMessage) {
    if (!this.port) throw new Error("port not loaded");
    const msg: InvokeRespMessage = { id, payload: null };
    try {
      const func = this.actions[type];
      if (!func) throw new NoHanlderError(type);
      const result = await func(...args);
      if (result === undefined) {
        this.port.postMessage(msg);
      } else {
        msg.payload = await result.value;
        this.port.postMessage(msg, { transfer: result.transfer });
      }
    } catch (e) {
      console.error("port messaging error", e);
      if (e instanceof Error) {
        msg.error = { message: e.message, stack: e.stack };
      } else {
        msg.error = { message: String(e) };
      }
      this.port.postMessage(msg);
    }
  }
}

export class TimeoutError extends Error {
  constructor(span: number) {
    super(`timeout after ${span}ms`);
  }
}
