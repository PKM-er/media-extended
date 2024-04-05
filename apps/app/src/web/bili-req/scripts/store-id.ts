export const storeId = ((id) => {
  if (!id) throw new Error("env var BILI_REQ_STORE not inited");
  return id;
})(process.env.BILI_REQ_STORE!);
