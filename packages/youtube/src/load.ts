type Callback = (errorOrNull: Error | null, script: HTMLScriptElement) => void;

type AllowedAttributes = "type" | "charset" | "async" | "text";

type Options = Partial<Pick<HTMLScriptElement, AllowedAttributes>> & {
  attrs?: Record<string, string>;
};

const load = async (src: string, opts: Options = {}): Promise<Event> => {
  const head = document.head || document.getElementsByTagName("head")[0];
  const script = document.createElement("script");

  script.type = opts.type || "text/javascript";
  script.charset = opts.charset || "utf8";
  script.async = "async" in opts ? !!opts.async : true;

  script.src = src;

  if (opts.attrs) {
    setAttributes(script, opts.attrs);
  }

  if (opts.text) {
    script.text = "" + opts.text;
  }

  const promise = new Promise<Event>((resolve, reject) => {
    script.onerror = reject;
    script.onload = resolve;
  });

  head.appendChild(script);

  return promise;
};
export default load;

const setAttributes = (
  script: HTMLScriptElement,
  attrs: Record<string, string>,
) => {
  for (let attr in attrs) {
    script.setAttribute(attr, attrs[attr]);
  }
};
