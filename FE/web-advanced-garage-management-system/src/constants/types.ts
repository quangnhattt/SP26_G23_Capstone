import type { Theme } from "@/context/ThemeContext";

export const AppStorageEnum = {
  TOKEN: "token",
  REFRESH_TOKEN: "refresh_token",
  PHONE: "phone",
  USER_ID: "user_id",
  PASSWORD_PHONE: "password_phone",
  PASSWORD_USER_ID: "password_user_id",
  TYPE_LOGIN: "type_login",
  CATEGORIES: "categories",
  GAMES: "games",
  RELOAD_CATEGORIES: "reload_categories",
  RELOAD_GAMES: "reload_games",
} as const;

export type AppStorageEnum = (typeof AppStorageEnum)[keyof typeof AppStorageEnum];

export const ResponseStatusEnum = {
  SUCCESSFULLY: "Successfully",
  FAIL: "Fail",
} as const;

export type ResponseStatusEnum =
  (typeof ResponseStatusEnum)[keyof typeof ResponseStatusEnum];

export const TypeLoginEnum = {
  MSISDN: "MSISDN",
  USERNAME: "USERNAME",
  EMAIL: "EMAIL",
} as const;

export type TypeLoginEnum =
  (typeof TypeLoginEnum)[keyof typeof TypeLoginEnum];

export const GenderEnum = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export type GenderEnum = (typeof GenderEnum)[keyof typeof GenderEnum];

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  msisdn: string;
  username: string;
  dob: string;
  gender: GenderEnum;
  paperType: string;
  paperNumber: string;
  paperIssueDate: string;
  address: string;
  country: string;
  countryId: string;
  currency: string;
  language: string;
  lastLoginAt: string;
  accountLevel: number;
  accountType: string;
  balance: number;
  userReferralCode: string;
  profileProgress: number;
  avatar: string;
}

export interface DeviceProps {
  isMobile?: boolean;
  statusBarHeight?: number;
  bottomStatusHeight?: number;
  theme?: Theme;
}

export interface ILanguage {
  code: string;
  name?: string;
  flag?: string;
  fullName?: string;
}
