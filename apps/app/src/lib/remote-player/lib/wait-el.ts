export function waitForSelector<T extends Element>(
  selector: string,
  el = document.body,
  timeout = 10e3,
) {
  return new Promise<T>((resolve, reject) => {
    const element = el.querySelector<T>(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = el.querySelector<T>(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
        window.clearTimeout(timeoutId);
      }
    });

    const timeoutId = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(`timeout waiting for ${selector}`));
    }, timeout);

    observer.observe(el, {
      childList: true,
      subtree: true,
    });
  });
}
