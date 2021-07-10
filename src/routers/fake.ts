import {
  createProxyMiddleware,
  Options,
  RequestHandler,
} from "http-proxy-middleware";

export const Route = "/fake/:host/";
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63";

const proxyOpt: Options = {
  target: "http://www.example.org", // target host
  changeOrigin: true, // needed for virtual hosted sites
  ws: true, // proxy websockets
  pathRewrite: {
    "^/fake/.+?/": "/", // rewrite path
  },
  router(req) {
    return "https://" + req.params.host;
  },
  onProxyReq(proxyReq) {
    proxyReq.setHeader("user-agent", ua);
    proxyReq.setHeader("referer", "https://www.bilibili.com/");
    proxyReq.setHeader("origin", "https://www.bilibili.com");
  },
  onProxyRes(proxyRes) {
    proxyRes.headers["Access-Control-Allow-Origin"] = "*";
  },
};

export const getProxy = (): RequestHandler => {
  const proxy = createProxyMiddleware(proxyOpt);
  return proxy;
};
