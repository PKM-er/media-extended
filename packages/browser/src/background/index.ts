console.log("background script");

// import browser from "webextension-polyfill";

// const { tabs } = browser;

// const getPrevTab = async (newTab: browser.Tabs.Tab) => {
//   if (newTab.index === 0) return null;
//   const prevId = (
//     await tabs.query({ index: newTab.index - 1, windowId: newTab.windowId })
//   )[0].id;
//   if (prevId) {
//     return (await tabs.get(prevId)) ?? null;
//   } else {
//     return null;
//   }
// };

// const getUrl = (url: string | undefined) => {
//   if (!url) return null;
//   try {
//     return new URL(url);
//   } catch (error) {
//     return null;
//   }
// };

// // prevent duplicate tabs, pass hash to current tab
// tabs.onCreated.addListener(async (tab) => {
//   const prevTab = (await getPrevTab(tab)) as browser.Tabs.Tab,
//     prevUrl = getUrl(prevTab?.url),
//     currUrl = getUrl(tab.pendingUrl || tab.url);
//   if (!prevUrl || !currUrl) return;
//   if (
//     prevUrl.host === currUrl.host &&
//     prevUrl.pathname === currUrl.pathname &&
//     prevUrl.search === currUrl.search
//   ) {
//     tab.id && tabs.remove(tab.id);
//     console.log("prevented duplicate tab");
//     if (currUrl.hash !== prevUrl.hash) {
//       // browser.tabs.executeScript(prevTab.id, {
//       //   code: `window.location.hash = "${currUrl.hash}"`,
//       // });
//     }
//   }
//   console.log(await tabs.query({ currentWindow: true }));
// });
