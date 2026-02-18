import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../rootReducer";
import type { IUser } from "@/constants/types";

export interface IAppState {
  appLoading: boolean;
  visibleLogin: boolean;
  visibleRegister: boolean;
  visibleForgotPassword: boolean;
  activeHeader: string;
  heightHeader: number;
  hideHeaderAndFooter: boolean;
  visibleProcessModal: boolean;
  visibleDrawer: boolean;
  userInfo: IUser | null;
}

export const initialState: IAppState = {
  appLoading: false,
  visibleLogin: false,
  visibleRegister: false,
  visibleForgotPassword: false,
  visibleDrawer: false,
  activeHeader: "AUTOGARAGE",
  heightHeader: 0,
  hideHeaderAndFooter: false,
  visibleProcessModal: false,
  userInfo: null,
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setAppLoading: (state: IAppState, { payload }: PayloadAction<boolean>) => {
      state.appLoading = payload;
    },
    setVisibleLogin: (
      state: IAppState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleLogin = payload;
    },
    setVisibleRegister: (
      state: IAppState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleRegister = payload;
    },
    setVisibleForgotPassword: (
      state: IAppState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleForgotPassword = payload;
    },
    setActiveHeader: (state: IAppState, { payload }: PayloadAction<string>) => {
      state.activeHeader = payload;
    },
    setHeightHeader: (state: IAppState, { payload }: PayloadAction<number>) => {
      state.heightHeader = payload;
    },
    setHideHeaderAndFooter: (
      state: IAppState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.hideHeaderAndFooter = payload;
    },
    setVisibleProcessModal: (
      state: IAppState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleProcessModal = payload;
    },
    setVisibleDrawer: (
      state: IAppState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleDrawer = payload;
    },
    setUserInfo: (
      state: IAppState,
      { payload }: PayloadAction<IUser | null>
    ) => {
      state.userInfo = payload;
    },
  },
});

export const {
  setAppLoading,
  setVisibleLogin,
  setVisibleRegister,
  setVisibleForgotPassword,
  setActiveHeader,
  setHeightHeader,
  setHideHeaderAndFooter,
  setVisibleProcessModal,
  setVisibleDrawer,
  setUserInfo,
} = appSlice.actions;

export const appSelector = (state: RootState) => state.app;

export default appSlice.reducer;
