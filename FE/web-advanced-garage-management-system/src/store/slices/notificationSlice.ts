import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../rootReducer";

export interface INotificationState {
  currentPageNotification: number;
}

export const initialState: INotificationState = {
  currentPageNotification: 1,
};

export const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setCurrentPageNotification: (
      state: INotificationState,
      { payload }: PayloadAction<number>
    ) => {
      state.currentPageNotification = payload;
    },
  },
});

export const { setCurrentPageNotification } = notificationSlice.actions;

export const notificationSelector = (state: RootState) => state.notification;

export default notificationSlice.reducer;
