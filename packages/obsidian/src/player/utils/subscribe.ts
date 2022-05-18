import { useAppDispatch, useAppSelector } from "@player/hooks";
import { AppDispatch, RootState } from "@store";
import { useLatest } from "ahooks";
import equal from "fast-deep-equal/es6";
import { MutableRefObject, useEffect, useRef } from "react";

import { Media } from "./media";

export type SubscribeHookType<R, M extends Media> = <T>(
  selector: (state: RootState) => T,
  action: (
    vals: [now: T, prev: T | null],
    dispatch: AppDispatch,
    player: M,
  ) => any,
  options: {
    immediate: boolean;
    once?: boolean;
    ref: MutableRefObject<R | null>;
  },
) => void;
export const getSubscribeHook =
  <R, M extends Media>(
    readySelector: (state: RootState) => boolean,
    getMediaFromRef: (refVal: R) => M,
  ): SubscribeHookType<R, M> =>
  <T>(
    selector: (state: RootState) => T,
    action: (
      vals: [now: T, prev: T | null],
      dispatch: AppDispatch,
      player: M,
    ) => any,
    options: {
      immediate: boolean;
      once?: boolean;
      ref: MutableRefObject<R | null>;
    },
  ) => {
    const actionRef = useLatest<typeof action>(action),
      optionsRef = useLatest<typeof options>(options);

    const isExecuted = useRef(false);
    const isMounted = useRef(false);

    const val = useAppSelector(selector),
      isReady = useAppSelector(readySelector);

    const dispatch = useAppDispatch();

    const prev = useRef<T | null>(null),
      queue = useRef<[now: T, prev: T | null] | null>();

    useEffect(() => {
      return () => {
        isMounted.current = false;
        isExecuted.current = false;
        prev.current = null;
        queue.current = null;
      };
    }, []);

    const effect = () => {
        const valUpdated = !equal(val, prev.current);

        const exec = (vals: [now: T, prev: T | null], player: M) => {
          actionRef.current(vals, dispatch, player);
          isExecuted.current = true;
          // latest state change is applied, empty preious queue
          queue.current = null;
        };

        const { ref } = optionsRef.current;
        const player = ref.current ? getMediaFromRef(ref.current) : null; // not available

        if (valUpdated) {
          const vals = [val, prev.current] as [now: T, prev: T | null];
          if (isReady) {
            if (player === null) {
              console.warn(
                "player not available when player status is 'ready'",
              );
            } else exec(vals, player);
          } else {
            // wait until player is ready
            queue.current = vals;
          }
        } else if (queue.current && isReady && player !== null) {
          exec(queue.current, player);
          queue.current = null;
        }
        prev.current = val;
      },
      deps = [val, isReady];

    useEffect(() => {
      const { immediate, once } = optionsRef.current;
      const shouldExecute = !(isExecuted.current === true && once);
      if (!isMounted.current) {
        isMounted.current = true;
        if (immediate && shouldExecute) effect();
      } else if (shouldExecute) {
        effect();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
  };
