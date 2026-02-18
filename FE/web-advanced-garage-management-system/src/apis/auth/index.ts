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

interface ILoginResponse {
  requestId: string;
  errorCode: string;
  message: ResponseStatusEnum;
  result: { accessToken: string; refreshToken: string };
}

export const login = async (payload: ILoginPayload) => {
  const data = await AxiosClient.post<ILoginResponse>(
    "/api/auth/login",
    payload
  );
  return data;
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

export const authService = {
  login,
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
