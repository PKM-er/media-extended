export const ReqBiliInjectCodeID = "req-bili-inject-code";
export const GotBiliInjectCodeID = "got-bili-inject-code";

export type GotBiliInjectCodeMsg = [
  id: typeof GotBiliInjectCodeID,
  code: string | null | undefined,
];
export type ReqBiliInjectCodeMsg = [id: typeof GotBiliInjectCodeID];

export const getBiliInjectCode = (port: MessagePort) =>
  new Promise<string | null | undefined>((resolve, _reject) => {
    let timeout = window.setTimeout(() => {
      console.error("failed to get bili inject code: timeout");
      resolve(null);
    }, 5000);
    port.postMessage([ReqBiliInjectCodeID]);
    port.addEventListener(
      "message",
      ({ data: [id, code] }) => {
        if (id !== GotBiliInjectCodeID) return;
        resolve(code);
        window.clearTimeout(timeout);
      },
      { once: true, passive: true },
    );
  });

export const handleBiliInjectCodeReq = (
  port: MessagePort,
  getCode: () => Promise<string | null> | undefined,
) => {
  port.addEventListener("message", async ({ data: [id] }) => {
    if (id !== ReqBiliInjectCodeID) return;
    console.log;
    const code = await getCode();
    const msg: GotBiliInjectCodeMsg = [GotBiliInjectCodeID, code];
    port.postMessage(msg);
  });
};
