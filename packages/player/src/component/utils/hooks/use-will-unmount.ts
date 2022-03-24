import { useLatest } from "ahooks";
import { useLayoutEffect } from "react";

/**
 * Returns a callback setter for a callback to be performed when the component will unmount.
 */
const useWillUnmount = (fn: () => void) => {
  if (process.env.NODE_ENV === "development") {
    if (typeof fn !== "function") {
      console.error(
        `useUnmount expected parameter is a function, got ${typeof fn}`,
      );
    }
  }

  const fnRef = useLatest(fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => () => fnRef.current(), []);
};
export default useWillUnmount;
