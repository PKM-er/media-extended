export interface SerilizableError {
  message: string;
  stack?: string;
}

/**
 * Message that expect a response
 */
export interface InvokeMessage {
  id: string;
  invoke: string;
  args?: any[];
}
export function isInvokeMessage(data: unknown): data is InvokeMessage {
  const msg = data as Record<string, unknown>;
  return typeof msg.id === "string" && typeof msg.invoke === "string";
}
export function genRequsetMessage(
  action: string,
  ...args: any[]
): InvokeMessage {
  return {
    id: genId(),
    invoke: action,
    args,
  };
}

export interface InvokeRespMessage {
  id: string;
  payload: any;
  error?: SerilizableError;
}
export function isInvokeRespMessage(data: unknown): data is InvokeRespMessage {
  const msg = data as Record<string, unknown>;
  return typeof msg.id === "string";
}

/**
 * Message that expect no response
 */
export interface SentMessage {
  send: string;
  payload?: any;
}
export function isSentMessage(data: unknown): data is SentMessage {
  const msg = data as Record<string, unknown>;
  return typeof msg.send === "string";
}
export function genSentMessage(action: string, payload?: any): SentMessage {
  return { send: action, payload };
}

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

export class NoHanlderError extends Error {
  constructor(type: string) {
    super(`no handler for ${type}`);
  }
}

export const PORT_READY_EVENT = "mx-port-ready";
