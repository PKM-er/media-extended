import { nanoid } from "nanoid";

export const BILI_REQ_STORE = nanoid(12);

export function replaceEnv(code: string) {
  return code.replaceAll(
    "process.env.BILI_REQ_STORE",
    JSON.stringify(BILI_REQ_STORE),
  );
}
