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
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
  return {
    accessToken: r?.accessToken ?? r?.access_token ?? "",
    refreshToken: r?.refreshToken ?? r?.refresh_token ?? "",
  };
};

export const loginWithEmail = async (payload: ILoginWithEmailPayload) => {
  const { data } = await AxiosClient.post<ILoginResponse>(
    "/api/auth/login",
    payload
  );
  const result = data?.result ?? (data as unknown as Record<string, unknown>);
  const r = result as {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
  return {
    accessToken: r?.accessToken ?? r?.access_token ?? "",
    refreshToken: r?.refreshToken ?? r?.refresh_token ?? "",
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
  console.log("response", response);
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
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export const register = async (payload: IRegisterPayload) => {
  const username =
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

export const authService = {
  login,
  loginWithEmail,
  register,
  refreshToken,
  logout,
  // registerRequest,
  // registerVerify,
  // registerConfirm,
  // quickRegister,
  // forgotPasswordRequest,
  // forgotPasswordVerifyOTP,
  // forgotPasswordConfirm,
  // checkMsisdn,
  // verifykMsisdn,
  // setPassword,
  // reSendOPT,
};
