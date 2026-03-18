import type { ResponseStatusEnum, TypeLoginEnum } from "@/constants/types";
import AxiosClient from "../AxiosClient";

/**
 * Login
 */
export interface ILoginPayload {
  username: string;
  password: string;
  type: TypeLoginEnum;
}

/**
 * Login with email (body: email, password)
 */
export interface ILoginWithEmailPayload {
  email: string;
  password: string;
}

interface ILoginResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
  result: { accessToken: string; refreshToken: string };
}

export const login = async (payload: ILoginPayload) => {
  const { data } = await AxiosClient.post<ILoginResponse>(
    "/api/auth/login",
    payload
  );
  const result = data?.result ?? (data as unknown as Record<string, unknown>);
  const r = result as {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
  
  const token = r?.token ?? r?.accessToken ?? r?.access_token ?? "";
  
  return {
    accessToken: token,
    refreshToken: token,
  };
};

interface ILoginWithEmailResponse {
  token: string;
  expiresAtUtc: string;
  userId: number;
  email: string;
  fullName: string;
}

export const loginWithEmail = async (payload: ILoginWithEmailPayload) => {
  const { data } = await AxiosClient.post<ILoginWithEmailResponse>(
    "/api/auth/login",
    payload
  );
  return {
    accessToken: data.token,
    refreshToken: data.token,
  };
};

/**
 * Refresh Token
 */
interface IRefreshTokenPayload {
  refreshToken: string;
}

interface IRefreshTokenResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
  result: { accessToken: string; refreshToken: string };
}

export const refreshToken = async (payload: IRefreshTokenPayload) => {
  const response = await AxiosClient.post<IRefreshTokenResponse>(
    "identity-service/v1/auth/refreshToken",
    payload
  );
  return response.data.result;
};

/**
 * Logout
 */

interface ILogoutPayload {
  refreshToken: string;
}

interface ILogoutResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
}

export const logout = async (payload: ILogoutPayload) => {
  const response = await AxiosClient.post<ILogoutResponse>(
    "identity-service/v1/auth/logout",
    { ...payload }
  );

  return response.data;
};

/**
 * Register
 */
export interface IRegisterPayload {
  fullName: string;
  username?: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export const register = async (payload: IRegisterPayload) => {
  const username =
    payload.username?.trim() ||
    "user_" +
      payload.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "") +
      "_" +
      Date.now().toString(36);
  const { data } = await AxiosClient.post("/api/auth/register", {
    fullName: payload.fullName,
    username,
    email: payload.email,
    phoneNumber: payload.phoneNumber || null,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  });
  return data;
};

/**
 * Verify OTP
 */
export interface IVerifyOTPPayload {
  email: string;
  otp: string;
}

interface IVerifyOTPResponse {
  success: boolean;
  message: string;
}

export const verifyOTP = async (payload: IVerifyOTPPayload) => {
  const { data } = await AxiosClient.post<IVerifyOTPResponse>(
    "/api/email-verification/verify-otp",
    payload
  );
  return data;
};

/**
 * Forgot Password - Send OTP
 */
export interface IForgotPasswordPayload {
  email: string;
}

interface IForgotPasswordResponse {
  success: boolean;
  message: string;
}

export const forgotPassword = async (payload: IForgotPasswordPayload) => {
  const { data } = await AxiosClient.post<IForgotPasswordResponse>(
    "/api/auth/forgot-password",
    payload
  );
  return data;
};

/**
 * Reset Password
 */
export interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface IResetPasswordResponse {
  success: boolean;
  message: string;
}

export const resetPassword = async (payload: IResetPasswordPayload) => {
  const { data } = await AxiosClient.post<IResetPasswordResponse>(
    "/api/auth/reset-password",
    payload
  );
  return data;
};

/**
 * Send OTP for Email Verification
 */
export interface ISendOTPPayload {
  email: string;
}

interface ISendOTPResponse {
  success: boolean;
  message: string;
}

export const sendOTP = async (payload: ISendOTPPayload) => {
  const { data } = await AxiosClient.post<ISendOTPResponse>(
    "/api/email-verification/send-otp",
    payload
  );
  return data;
};

export const authService = {
  login,
  loginWithEmail,
  register,
  verifyOTP,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  sendOTP,
};
