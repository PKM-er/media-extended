/* eslint-disable prefer-arrow/prefer-arrow-functions */
import {
  ActionReducerMapBuilder,
  AnyAction,
  CaseReducer,
  createAction,
  CreateSliceOptions,
  Draft,
  Slice,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { TypedActionCreator } from "@reduxjs/toolkit/dist/mapBuilders";
import { NoInfer, TypeGuard } from "@reduxjs/toolkit/dist/tsHelpers";

import { RootState } from ".";

export interface GetReducer<State> {
  <CR extends SliceCaseReducers<State>>(cr: CR): CR;
}
export const getReducer: GetReducer<RootState> = (cr) => cr;

type Reducers<RState> = {
  addCase: [
    typeOrActionCreator: string | TypedActionCreator<any>,
    reducer: CaseReducer<RState>,
  ][];
  addMatcher: [
    matcher: TypeGuard<AnyAction>,
    reducer: CaseReducer<RState, AnyAction>,
  ][];
};
export const createSlice = <
  State,
  CaseReducers extends SliceCaseReducers<State>,
  RState = RootState,
  Name extends string = string,
>({
  initialState,
  name,
  reducers,
  extraReducers,
  getState,
  setState,
}: Omit<
  CreateSliceOptions<State, CaseReducers, Name>,
  "initialState" | "extraReducers"
> & {
  initialState: State;
  extraReducers?: (builder: ActionReducerMapBuilder<NoInfer<State>>) => void;
  getState: (root: Draft<RState>) => Draft<State>;
  setState: (root: Draft<RState>, draft: Draft<State> | State) => void | RState;
}): Pick<Slice<State, CaseReducers, Name>, "name" | "actions"> & {
  initialState: State;
  reducers: () => Reducers<RState>;
} => {
  const reducerNames = Object.keys(reducers);
  const actions: any = {};
  const caseReducers: any = {};
  for (const reducerName of reducerNames) {
    const type = `${name}/${reducerName}`;
    actions[reducerName] = createAction(type);
    caseReducers[type] = reducers[reducerName];
  }
  return {
    name,
    actions,
    reducers: () => {
      const convert =
        <CR extends CaseReducer>(reducer: CR) =>
        (state: Draft<RState>, action: any) => {
          const result = reducer(getState(state), action);
          if (result) return setState(state, result);
        };
      const reducers: Reducers<RState> = { addCase: [], addMatcher: [] };
      const _builder = {
        addCase(
          typeOrActionCreator: string | TypedActionCreator<any>,
          reducer: CaseReducer<State>,
        ) {
          reducers.addCase.push([typeOrActionCreator, convert(reducer)]);
          return _builder;
        },
        addMatcher<A>(
          matcher: TypeGuard<A>,
          reducer: CaseReducer<State, A extends AnyAction ? A : A & AnyAction>,
        ) {
          reducers.addMatcher.push([matcher as any, convert(reducer as any)]);
          return _builder;
        },
        addDefaultCase(reducer: CaseReducer<State, AnyAction>) {
          // builder.addDefaultCase(convert(reducer));
          return _builder;
        },
      };
      for (const type in caseReducers) {
        _builder.addCase(type, caseReducers[type]);
      }
      extraReducers?.(_builder);
      return reducers;
    },
    initialState,
  };
};
