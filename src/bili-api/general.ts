interface returnBody_Basic<SCode extends statusCode,T> {
  code: SCode;
  ttl: 1;
  /** 错误信息 */
  message: errorMessage<SCode>;
  data: data<SCode,T>;
}

type returnSuccess<T> = returnBody_Basic<statusCode.success, T>;
type returnError = returnBody_Basic<
  Exclude<statusCode, statusCode.success>,
  any
>;

export type returnBody<T> = returnSuccess<T> | returnError


// prettier-ignore
type errorMessage<C extends statusCode> 
  = C extends statusCode.success ? "0" : string;
// prettier-ignore
type data<C extends statusCode,T> 
  = C extends statusCode.success ? T : null;

export const enum statusCode {
  success = 0,
  /** 请求错误 */
  invalid = -400,
  /** 无视频 */
  notFound = -404,
}

export const enum vidType {
  avid,
  bvid
}

export function isBiliVId(id: string | number): vidType | null {
  if (typeof id === "number" && Number.isInteger(id)) return vidType.avid;
  else if (typeof id === "string" && /^bv/i.test(id)) return vidType.bvid;
  else console.log("Invalid id: " + id);
  return null;
}