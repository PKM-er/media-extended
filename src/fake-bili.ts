import { default as express } from "express";
import { NextFunction, Request, Response } from "express";
import * as Fake from './routers/fake'
import * as PlayUrl from './routers/playUrl'

export function getServer(port: number) {
  const app = express();

  app.use(Fake.Route, Fake.getProxy());
  app.use(PlayUrl.Route, PlayUrl.getHandler(port));
  app.use(function (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    console.error(err.stack);
    res.status(500).send(err.message);
  });

  return app;
}