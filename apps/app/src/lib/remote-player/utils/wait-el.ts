export function waitForSelector<T extends Element>(
  selector: string,
  el = document.body,
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
        window.clearTimeout(timeout);
      }
    });

    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(`timeout waiting for ${selector}`));
    }, 10e3);

    observer.observe(el, {
      childList: true,
      subtree: true,
    });
  });
}
