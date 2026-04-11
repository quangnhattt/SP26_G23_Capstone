import AxiosClient from "@/apis/AxiosClient";

// ── Permission Groups ──────────────────────────────────────────────────────────
export interface IPermissionGroup {
  groupID: number;
  groupName: string;
  description: string;
}

export interface IPermissionGroupRequest {
  groupName: string;
  description: string;
}

// ── Permissions ────────────────────────────────────────────────────────────────
export interface IPermission {
  permissionID: number;
  groupID: number;
  groupName?: string;
  name: string;
  url: string;
  description: string;
}

export interface IPermissionRequest {
  groupID: number;
  name: string;
  url: string;
  description: string;
}

// ── Role Permissions ───────────────────────────────────────────────────────────
export interface IRolePermissionMatrix {
  permissionID: number;
  name: string;
  url: string;
  description: string;
  groupName: string;
  isGranted: boolean;
}

export interface IRole {
  roleID: number;
  roleName: string;
}

// ── Permission Groups API ──────────────────────────────────────────────────────
export const getPermissionGroups = async (): Promise<IPermissionGroup[]> => {
  const { data } = await AxiosClient.get<IPermissionGroup[]>("/api/PermissionGroups");
  return data;
};

export const getPermissionGroupById = async (id: number): Promise<IPermissionGroup> => {
  const { data } = await AxiosClient.get<IPermissionGroup>(`/api/PermissionGroups/${id}`);
  return data;
};

export const createPermissionGroup = async (body: IPermissionGroupRequest): Promise<IPermissionGroup> => {
  const { data } = await AxiosClient.post<IPermissionGroup>("/api/PermissionGroups", body);
  return data;
};

export const updatePermissionGroup = async (id: number, body: IPermissionGroupRequest): Promise<IPermissionGroup> => {
  const { data } = await AxiosClient.put<IPermissionGroup>(`/api/PermissionGroups/${id}`, body);
  return data;
};

export const deletePermissionGroup = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/PermissionGroups/${id}`);
};

// ── Permissions API ────────────────────────────────────────────────────────────
export const getPermissions = async (): Promise<IPermission[]> => {
  const { data } = await AxiosClient.get<IPermission[]>("/api/Permissions");
  return data;
};

export const createPermission = async (body: IPermissionRequest): Promise<IPermission> => {
  const { data } = await AxiosClient.post<IPermission>("/api/Permissions", body);
  return data;
};

export const updatePermission = async (id: number, body: IPermissionRequest): Promise<IPermission> => {
  const { data } = await AxiosClient.put<IPermission>(`/api/Permissions/${id}`, body);
  return data;
};

export const deletePermission = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/Permissions/${id}`);
};

// ── Role Permissions API ───────────────────────────────────────────────────────
export const getRolePermissionMatrix = async (roleId: number): Promise<IRolePermissionMatrix[]> => {
  const { data } = await AxiosClient.get<IRolePermissionMatrix[]>(`/api/RolePermissions/matrix/${roleId}`);
  return data;
};

export const updateRolePermissions = async (roleId: number, permissionIds: number[]): Promise<void> => {
  await AxiosClient.put(`/api/RolePermissions/editUserPermission`, permissionIds, {
    params: { roleId },
  });
};

export const getRoles = async (): Promise<IRole[]> => {
  const { data } = await AxiosClient.get<IRole[]>("/api/roles");
  return data;
};
