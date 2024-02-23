// All errors: chrome://network-errors/

export function webviewErrorMessage(evt: WebviewLoadError) {
  switch (evt.code) {
    case -202:
      return `SSL certificate isn't trusted by the browser. If the website is self-hosted, double check the SSL certificate and test it with a browser. `;
    default:
      return evt.message;
  }
}

export class WebviewLoadError extends Error {
  code: number;
  description: string;
  url: string;
  constructor(evt: Electron.DidFailLoadEvent) {
    super(`${evt.errorCode}: ${evt.errorDescription}`);
    this.code = evt.errorCode;
    this.url = evt.validatedURL;
    this.description = evt.errorDescription;
  }
}
