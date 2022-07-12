/* eslint-disable prefer-arrow/prefer-arrow-functions */
import {
  Action,
  ActionReducerMapBuilder,
  AnyAction,
  CaseReducer,
  CaseReducerActions,
  CaseReducers,
  createAction,
  createReducer,
  PrepareAction,
  SliceCaseReducers,
  ValidateSliceCaseReducers,
} from "@reduxjs/toolkit";
import type { ReducerWithInitialState } from "@reduxjs/toolkit/dist/createReducer";
import type { NoInfer } from "@reduxjs/toolkit/dist/tsHelpers";

import { executeReducerBuilderCallback } from "./map-builder";
export { executeReducerBuilderCallback };

const getType = (slice: string, actionKey: string): string =>
  `${slice}/${actionKey}`;

// simplified createSlice that returns a reducer function to be used inside
// main reducer function and actions
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function createSlice<
  State,
  CaseReducers extends SliceCaseReducers<State>,
  Name extends string = string,
>({
  name,
  reducers = {} as any,
  extraReducers,
}: CreateSliceOptions<State, CaseReducers, Name>): Slice<
  State,
  CaseReducers,
  Name
> {
  const reducerNames = Object.keys(reducers);

  const sliceCaseReducersByName: Record<string, CaseReducer> = {};
  const sliceCaseReducersByType: Record<string, CaseReducer> = {};
  const actionCreators: Record<string, Function> = {};

  reducerNames.forEach((reducerName) => {
    const maybeReducerWithPrepare = reducers[reducerName];
    const type = getType(name, reducerName);

    let caseReducer: CaseReducer<State, any>;
    let prepareCallback: PrepareAction<any> | undefined;

    if ("reducer" in maybeReducerWithPrepare) {
      caseReducer = maybeReducerWithPrepare.reducer;
      prepareCallback = maybeReducerWithPrepare.prepare;
    } else {
      caseReducer = maybeReducerWithPrepare;
    }

    sliceCaseReducersByName[reducerName] = caseReducer;
    sliceCaseReducersByType[type] = caseReducer;
    actionCreators[reducerName] = prepareCallback
      ? createAction(type, prepareCallback)
      : createAction(type);
  });

  const buildReducer = () => {
    const [
      _extraReducers = {},
      actionMatchers = [],
      defaultCaseReducer = undefined,
    ] =
      typeof extraReducers === "function"
        ? executeReducerBuilderCallback(extraReducers)
        : [extraReducers];

    const finalCaseReducers = { ..._extraReducers, ...sliceCaseReducersByType };

    return createReducer(
      () => {
        throw new Error("No State Given");
      },
      finalCaseReducers as any,
      actionMatchers,
      defaultCaseReducer,
    );
  };

  let _reducer: ReducerWithInitialState<State>;

  return {
    name,
    reducer: (state, action) => {
      if (!_reducer) _reducer = buildReducer();
      return _reducer(state, action);
    },
    actions: actionCreators as any,
  };
}

interface Slice<
  State = any,
  CaseReducers extends SliceCaseReducers<State> = SliceCaseReducers<State>,
  Name extends string = string,
> {
  /**
   * The slice name.
   */
  name: Name;
  /**
   * The slice's reducer.
   */
  reducer: Reducer<State>;
  /**
   * Action creators for the types of actions that are handled by the slice
   * reducer.
   */
  actions: CaseReducerActions<CaseReducers>;
}

type Reducer<S = any, A extends Action<any> = AnyAction> = (
  state: S,
  action: A,
) => void;

export interface CreateSliceOptions<
  State = any,
  CR extends SliceCaseReducers<State> = SliceCaseReducers<State>,
  Name extends string = string,
> {
  /**
   * The slice's name. Used to namespace the generated action types.
   */
  name: Name;
  /** no need to pass actual state, only used for type infering */
  state: State;
  /**
   * A mapping from action types to action-type-specific *case reducer*
   * functions. For every action type, a matching action creator will be
   * generated using `createAction()`.
   */
  reducers: ValidateSliceCaseReducers<State, CR>;
  /**
     * A callback that receives a *builder* object to define
     * case reducers via calls to `builder.addCase(actionCreatorOrType, reducer)`.
     *
     * Alternatively, a mapping from action types to action-type-specific *case reducer*
     * functions. These reducers should have existing action types used
     * as the keys, and action creators will _not_ be generated.
     *
     * @example
  ```ts
  import { createAction, createSlice, Action, AnyAction } from '@reduxjs/toolkit'
  const incrementBy = createAction<number>('incrementBy')
  const decrement = createAction('decrement')
  
  interface RejectedAction extends Action {
    error: Error
  }
  
  function isRejectedAction(action: AnyAction): action is RejectedAction {
    return action.type.endsWith('rejected')
  }
  
  createSlice({
    name: 'counter',
    initialState: 0,
    reducers: {},
    extraReducers: builder => {
      builder
        .addCase(incrementBy, (state, action) => {
          // action is inferred correctly here if using TS
        })
        // You can chain calls, or have separate `builder.addCase()` lines each time
        .addCase(decrement, (state, action) => {})
        // You can match a range of action types
        .addMatcher(
          isRejectedAction,
          // `action` will be inferred as a RejectedAction due to isRejectedAction being defined as a type guard
          (state, action) => {}
        )
        // and provide a default case if no other handlers matched
        .addDefaultCase((state, action) => {})
      }
  })
  ```
     */
  extraReducers?:
    | CaseReducers<NoInfer<State>, any>
    | ((builder: ActionReducerMapBuilder<NoInfer<State>>) => void);
}
