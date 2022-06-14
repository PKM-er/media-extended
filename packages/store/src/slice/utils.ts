import { SliceCaseReducers } from "@reduxjs/toolkit";

export interface GetReducer<State> {
  <CR extends SliceCaseReducers<State>>(cr: CR): CR;
}
