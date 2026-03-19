import dayjs from "@/utils/dayjs";
import type { RootState } from "../rootReducer";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface IProfileState {
  visibleOTPConfirm: boolean;
  visibleAccountConfirm: boolean;
  visibleChangePassword: boolean;
  visibleSuccess: boolean;
  currentPagePromotion: number;
  currentPageInvite: number;
  verifyEmail: string;
  verifyPhone: string;
  verifyTransactionId: string;
  typeAccountVerify: "email" | "phone";
  inviteDate: [Date, Date];
}

export const initialState: IProfileState = {
  visibleOTPConfirm: false,
  visibleAccountConfirm: false,
  visibleChangePassword: false,
  visibleSuccess: false,
  currentPagePromotion: 1,
  currentPageInvite: 1,
  verifyEmail: "",
  verifyPhone: "",
  verifyTransactionId: "",
  typeAccountVerify: "email",
  inviteDate: [
    dayjs().startOf("month").toDate(),
    dayjs().endOf("day").toDate(),
  ],
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setVisibleOTPConfirm: (
      state: IProfileState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleOTPConfirm = payload;
    },
    setVisibleAccountConfirm: (
      state: IProfileState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleAccountConfirm = payload;
    },
    setVisibleChangePassword: (
      state: IProfileState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleChangePassword = payload;
    },
    setVisibleChangePasswordSuccess: (
      state: IProfileState,
      { payload }: PayloadAction<boolean>
    ) => {
      state.visibleSuccess = payload;
    },
    setCurrentPagePromotion: (
      state: IProfileState,
      { payload }: PayloadAction<number>
    ) => {
      state.currentPagePromotion = payload;
    },
    setCurrentPageInvite: (
      state: IProfileState,
      { payload }: PayloadAction<number>
    ) => {
      state.currentPageInvite = payload;
    },
    setVerifyEmail: (
      state: IProfileState,
      { payload }: PayloadAction<string>
    ) => {
      state.verifyEmail = payload;
    },
    setVerifyPhone: (
      state: IProfileState,
      { payload }: PayloadAction<string>
    ) => {
      state.verifyPhone = payload;
    },
    setVerifyTransactionId: (
      state: IProfileState,
      { payload }: PayloadAction<string>
    ) => {
      state.verifyTransactionId = payload;
    },
    setTypeAccountVerify: (
      state: IProfileState,
      { payload }: PayloadAction<"email" | "phone">
    ) => {
      state.typeAccountVerify = payload;
    },
    setInviteDate: (
      state: IProfileState,
      { payload }: PayloadAction<[Date, Date]>
    ) => {
      state.inviteDate = payload;
    },
  },
});

export const {
  setVisibleOTPConfirm,
  setVisibleAccountConfirm,
  setVisibleChangePassword,
  setVisibleChangePasswordSuccess,
  setCurrentPagePromotion,
  setCurrentPageInvite,
  setVerifyEmail,
  setVerifyPhone,
  setVerifyTransactionId,
  setTypeAccountVerify,
  setInviteDate,
} = profileSlice.actions;

export const profileSelector = (state: RootState) => state.profile;

export default profileSlice.reducer;
