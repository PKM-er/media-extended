import type { AppDispatch, PlayerStore, RootState } from "mx-store";
import {
  TypedUseSelectorHook,
  useDispatch,
  useSelector,
  useStore,
} from "react-redux";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const usePlayerStore = () => useStore() as PlayerStore;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
