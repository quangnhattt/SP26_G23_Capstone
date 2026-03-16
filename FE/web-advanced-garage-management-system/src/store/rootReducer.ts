import { combineReducers } from "@reduxjs/toolkit";

import app from "./slices/appSlice";
// import profile from "./slices/profileSlice"; // Removed: unused slice causing unnecessary dayjs imports
import notification from "./slices/notificationSlice";

export type RootState = ReturnType<typeof rootReducer>;

const rootReducer = combineReducers({
  app,
  // profile, // Removed: unused slice
  notification,
});

export default rootReducer;
