import {
  Action,
  AnyAction,
  Dispatch,
  MiddlewareAPI,
  Store,
} from "@reduxjs/toolkit";
import assertNever from "assert-never";

import {
  GOT_INIT_STATE,
  gotInitState,
  GotInitStateAction,
  REQ_INIT_STATE,
  SEND_INIT_STATE,
  sendIniteState,
  StampedAction,
} from "./actions";

type MsgSyncAction = [name: "sync-action", action: AnyAction];
type MsgReqSyncState = [name: "req-init-state"];
type MsgSendState = [name: "send-init-state", state: any];
type MsgData = MsgSyncAction | MsgReqSyncState | MsgSendState;

export default class MessageHandler {
  /** is remote state recieved */
  private isSynced;

  constructor(
    isHost: boolean,
    private allowed?: (action: AnyAction) => boolean,
  ) {
    this.isSynced = isHost;
  }

  store: Store | null = null;
  get dispatch() {
    return this.store?.dispatch;
  }

  private _port: MessagePort | null = null;
  set port(port: MessagePort | null) {
    if (!port || this._port !== port) {
      this._port?.removeEventListener("message", this.onMessage);
      this._port?.close();
    }
    if (port) {
      port.addEventListener("message", this.onMessage);
      port.start();
      if (!this.isSynced) {
        this.requsetInitState();
      }
    }
    this._port = port;
  }
  get port() {
    return this._port;
  }

  private postMessage(msg: MsgData) {
    this._port?.postMessage(msg);
  }
  public requsetInitState() {
    this.postMessage(["req-init-state"]);
  }
  public syncAction(action: AnyAction) {
    this.postMessage(["sync-action", action]);
  }
  public sendInitState(state: any) {
    this.postMessage(["send-init-state", state]);
  }

  private onMessage = ({ data }: MessageEvent<MsgData>) => {
    if (!data?.[0]) return;
    if (!this.dispatch) throw new Error("store api is not set");
    switch (data[0]) {
      case "sync-action":
        if (
          data[1].type !== GOT_INIT_STATE &&
          (!this.allowed || this.allowed(data[1]))
        ) {
          this.dispatch({ ...data[1], $fromRemote: true } as StampedAction);
        }
        break;
      case "req-init-state":
        // payload(state) will be added in middleware
        this.dispatch(sendIniteState());
        break;
      case "send-init-state":
        if (!this.isSynced) {
          this.isSynced = true;
          this.dispatch(gotInitState(data[1]));
        }
        break;
    }
  };
}
