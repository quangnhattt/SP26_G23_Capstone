import type { GenderEnum, IUser, ResponseStatusEnum } from "@/constants/types";
import AxiosClient from "../AxiosClient";

/**
 * User Info
 */

interface IUserInfoResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
  result: IUser;
}

export const userInfo = async () => {
  const response = await AxiosClient.get<IUserInfoResponse>(
    "identity-service/v1/account/info"
  );
  return response.data.result;
};

/**
 * Update Info
 */

interface IUpdateInfoPayload {
  fullName?: string;
  username?: string;
  dob?: number;
  gender?: GenderEnum;
  paperType?: string;
  paperNumber?: string;
  address?: string;
  currency?: string;
  countryId?: string;
  language?: string;
}

interface IUpdateInfoResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
  result: IUser;
}

export const updateInfo = async (payload: IUpdateInfoPayload) => {
  const response = await AxiosClient.put<IUpdateInfoResponse>(
    "identity-service/v1/account/info",
    payload
  );
  return response.data.result;
};

/**
 * Verify Email
 */

interface IVerifyEmailPayload {
  email: string;
}

interface IVerifyEmailResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
  result: string;
}

export const verifyEmail = async (payload: IVerifyEmailPayload) => {
  const response = await AxiosClient.post<IVerifyEmailResponse>(
    "identity-service/v1/account/verify/email",
    payload
  );
  return response.data.result;
};

/**
 * Verify Email Confirm
 */

interface IVerifyEmailConfirmPayload {
  email: string;
  transactionId: string;
  otp: string;
}

interface IVerifyEmailConfirmResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
}

export const verifyEmailConfirm = async (
  payload: IVerifyEmailConfirmPayload
) => {
  const response = await AxiosClient.post<IVerifyEmailConfirmResponse>(
    "identity-service/v1/account/verify/email/confirm",
    payload
  );
  return response.data;
};

/**
 * Change Password
 */

interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

interface IChangePasswordResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
}

export const changePassword = async (payload: IChangePasswordPayload) => {
  const response = await AxiosClient.put<IChangePasswordResponse>(
    "identity-service/v1/account/changePassword",
    payload
  );
  return response.data;
};

export const userService = {
  userInfo,
  updateInfo,
  verifyEmail,
  verifyEmailConfirm,
  changePassword,
//   updateAvatar,
};
