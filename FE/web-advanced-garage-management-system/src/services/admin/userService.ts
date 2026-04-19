import AxiosClient from "@/apis/AxiosClient";

export interface IUser {
  userID: number;
  userCode: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  gender: string | null;
  dateOfBirth: string | null;
  image: string | null;
  roleID: number;
  roleName: string;
  isActive: boolean;
  createdDate: string;
}

export interface IUserRequest {
  userCode?: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  phoneNumber?: string;
  gender: string;
  dateOfBirth: string;
  image?: string;
  roleID: number;
  isActive: boolean;
  password?: string;
  confirmPassword?: string;
}

export type IUsersResponse = IUser[];

export const getUsers = async (): Promise<IUsersResponse> => {
  const { data } = await AxiosClient.get<IUsersResponse>("/api/users");
  return data;
};

export type SearchUsersOptions = {
  /** Lọc theo vai trò (ví dụ 4 = khách hàng) — gửi kèm query khi có giá trị. */
  roleId?: number;
};

export const searchUsers = async (
  phone: string,
  options?: SearchUsersOptions,
): Promise<IUsersResponse> => {
  const { data } = await AxiosClient.get<IUsersResponse>("/api/users", {
    params: {
      phone,
      ...(options?.roleId != null ? { roleId: options.roleId } : {}),
    },
  });
  return data;
};

export const getUserById = async (id: number): Promise<IUser> => {
  const { data } = await AxiosClient.get<IUser>(`/api/users/${id}`);
  return data;
};

export const createUser = async (user: IUserRequest): Promise<IUser> => {
  const { data } = await AxiosClient.post<IUser>("/api/users", user);
  return data;
};

export const updateUser = async (
  id: number,
  user: IUserRequest,
): Promise<IUser> => {
  const { data } = await AxiosClient.put<IUser>(`/api/users/${id}`, user);
  return data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/users/${id}`);
};

export const updateUserStatus = async (
  id: number,
  isActive: boolean,
): Promise<void> => {
  await AxiosClient.patch(`/api/users/${id}/status`, { isActive });
};

export const userService = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
};
