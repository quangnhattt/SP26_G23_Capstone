import { combineReducers } from "@reduxjs/toolkit";

import app from "./slices/appSlice";
import profile from "./slices/profileSlice";
import notification from "./slices/notificationSlice";

export type RootState = ReturnType<typeof rootReducer>;

const rootReducer = combineReducers({
  app,
  profile,
  notification,
});

export default rootReducer;
