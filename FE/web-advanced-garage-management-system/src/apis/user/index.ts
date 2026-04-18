import type { IUser, ResponseStatusEnum } from "@/constants/types";
import AxiosClient from "../AxiosClient";

/**
 * User Info
 */

interface IUserInfoApiResponse {
  userID: number;
  userCode: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  image: string;
  roleID: number;
  roleName: string;
  isActive: boolean;
  createdDate: string;
  lastLoginDate: string | null;
  totalSpending: number;
  currentRankID: number | null;
  rankName: string | null;
  totalRepairs: number;
  isOnRescueMission: boolean;
  skills: string | null;
}

export const userInfo = async (): Promise<IUser> => {
  const response = await AxiosClient.get<IUserInfoApiResponse>(
    "api/user/info"
  );
  const data = response.data;
  
  // Map API response to IUser interface
  return {
    id: data.userID.toString(),
    fullName: data.fullName,
    email: data.email,
    msisdn: data.phone,
    username: data.username,
    dob: data.dateOfBirth,
    gender: data.gender === "Male" ? "MALE" : "FEMALE",
    paperType: "",
    paperNumber: "",
    paperIssueDate: "",
    address: "",
    country: "",
    countryId: "",
    currency: "",
    language: "vi",
    lastLoginAt: data.lastLoginDate || "",
    accountLevel: 0,
    accountType: data.roleName,
    balance: data.totalSpending,
    totalSpending: data.totalSpending,
    userReferralCode: data.userCode,
    profileProgress: 0,
    avatar: data.image,
    roleID: data.roleID,
    createdDate: data.createdDate,
    rankName: data.rankName || undefined,
    totalRepairs: data.totalRepairs,
  };
};

/**
 * Update Info
 */

export interface IUpdateInfoPayload {
  fullName: string;
  phoneNumber?: string;
  gender?: string;
  image?: string;
  dateOfBirth?: string;
}

interface IUpdateInfoResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
  result: IUser;
}

export const updateInfo = async (payload: IUpdateInfoPayload) => {
  const response = await AxiosClient.put<IUpdateInfoResponse>(
    "api/user/info",
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
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface IChangePasswordResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
}

export const changePassword = async (payload: IChangePasswordPayload) => {
  const response = await AxiosClient.post<IChangePasswordResponse>(
    "api/auth/change-password",
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
