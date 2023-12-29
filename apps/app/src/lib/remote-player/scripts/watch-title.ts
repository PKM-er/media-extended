export {};

const port = await MX_MESSAGE;
const titleEl = document.querySelector("title");
let prevTitle = document.title;
if (titleEl) {
  new MutationObserver(() => {
    if (prevTitle === document.title) return;
    port.send("titlechange", { title: document.title });
    prevTitle = document.title;
  }).observe(titleEl, {
    subtree: true,
    characterData: true,
    childList: true,
  });
  console.log("watching title");
} else {
  console.log(`title el not found`);
}
