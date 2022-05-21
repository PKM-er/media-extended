import { AnyAction } from "@reduxjs/toolkit";

export const REQ_INIT_STATE = "&_REQ_INIT_STATE",
  SEND_INIT_STATE = "&_SEND_INIT_STATE",
  GOT_INIT_STATE = "&_GOT_INIT_STATE",
  INIT_MESSAGE_LISTENER = "&_INIT_MESSAGE_LISTENER";

const RequestInitStateAction = { type: REQ_INIT_STATE } as const;
export type RequestInitStateAction = typeof RequestInitStateAction;
export const requsetInitState = () => RequestInitStateAction;

const SendInitStateAction = { type: SEND_INIT_STATE } as const;
export type SendInitStateAction = typeof SendInitStateAction;
/** the state is added to payload before send */
export type SendInitStateActionFromChannel = typeof SendInitStateAction & {
  payload: any;
};
export const sendIniteState = () => SendInitStateAction;

export type GotInitStateAction = {
  readonly type: typeof GOT_INIT_STATE;
  readonly payload: any;
};
export const gotInitState = (state: any): GotInitStateAction => ({
  type: GOT_INIT_STATE,
  payload: state,
});

export const InternalActionTypes = [
  REQ_INIT_STATE,
  SEND_INIT_STATE,
  GOT_INIT_STATE,
] as const;

interface Stamp {
  $fromRemote: true;
}
export type StampedAction = Stamp & AnyAction;
