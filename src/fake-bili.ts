

import httpProxy from 'http-proxy';
import http from "http";
import https from "https";
import { parseUrl } from "query-string";
import { getPageList, PageListParams } from "bili-api/getPageList";
import { fetch_method, getPlayUrl, PlayUrlParams, video_quality } from "bili-api/getPlayUrl";
import { statusCode, vidType } from "bili-api/general";
import assertNever from "assert-never";

export function openProxy() {

  var welcome = [
    "#    # ##### ##### #####        #####  #####   ####  #    # #   #",
    "#    #   #     #   #    #       #    # #    # #    #  #  #   # # ",
    "######   #     #   #    # ##### #    # #    # #    #   ##     #  ",
    "#    #   #     #   #####        #####  #####  #    #   ##     #  ",
    "#    #   #     #   #            #      #   #  #    #  #  #    #  ",
    "#    #   #     #   #            #      #    #  ####  #    #   #   ",
  ].join("\n");

  const proxy = httpProxy.createProxyServer();
  

  var server = http.createServer(async (req, res) => {
    function throwError(message:string,error=400) {
      res.writeHead(error, { "Content-Type": "text/plain" });
      res.write(message);
      res.end();
    }

    if (req.url){
      const parseResult = parseUrl(req.url);

      const routes = parseResult.url.split('/');

      let id: { type: vidType.bvid; value: string } | { type: vidType.avid; value: number };
      let page: number|null;

      if (routes.length === 2 && routes[1]) {
        let idValue = routes[1].substring(2);
        if (/^av/i.test(routes[1]) && parseInt(idValue))
          id = { type: vidType.avid, value: parseInt(idValue) };
        else if (/^bv/i.test(routes[1])) id = { type: vidType.bvid, value: idValue };
        else {
          throwError("invalid avid/bvid");
          return;
        }
      } else {
        throwError("pathname invalid: " + parseResult.url);
        return;
      }
      
      const { p } = parseResult.query;
      if (typeof p === "string" && parseInt(p)){
        page = parseInt(p);
      } else {
        page = null;
        if (p) console.error("invalid p, ignored" + p);
      }

      let argPl : PageListParams;

      switch (id.type) {
        case vidType.avid:
          argPl = {aid:id.value}
          break;
        case vidType.bvid:
          argPl = {bvid:"BV"+id.value}
          break;      
        default:
          assertNever(id);
      }
      const pagelistData = (await getPageList(argPl)).data;

      if (pagelistData.code!==statusCode.success){
        throwError(pagelistData.message,-pagelistData.code);
        return;
      }

      let cid;
      if (page)
        cid = pagelistData.data[page].cid;
      else
        cid = pagelistData.data[0].cid;

      console.log("cid: "+cid);

      let argPu : PlayUrlParams;
      switch (id.type) {
        case vidType.avid:
          argPu = {avid:id.value,cid}
          break;
        case vidType.bvid:
          argPu = {bvid:"BV"+id.value,cid}
          break;      
        default:
          assertNever(id);
      }

      const fnval = fetch_method.mp4;
      argPu.qn = video_quality._240p;
      argPu.fnval = fnval;

      let playUrlData = (await getPlayUrl<typeof fnval>(argPu)).data;

      if (playUrlData.code!==statusCode.success){
        throwError(playUrlData.message,-playUrlData.code);
        return;
      }

      let url = new URL(playUrlData.data.durl[0].url);
      console.log(url);

      let reqOpt = {
        "headers": {
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36 Edg/89.0.774.63",
          "referer": "https://www.bilibili.com/",
        },
        "hostname": url.hostname,
        "path": url.pathname + url.search,
      };

      let proxyReq = https.request(reqOpt,proxyRes => {
        res.writeHead(proxyRes.statusCode as number, proxyRes.headers)
        proxyRes.pipe(res, {
          end: true
        });
      }).on("error", (err) => {
        throwError(err.message)
      });

      req.pipe(proxyReq, {
        end: true
      });
    } else {
      res.writeHead(400, {"Content-Type": "text/plain"});
      res.write("url not found");
      res.end();
  }
    
  });
  console.log("listening on port 2333")
  server.listen(2333);

  console.log(welcome);

}

