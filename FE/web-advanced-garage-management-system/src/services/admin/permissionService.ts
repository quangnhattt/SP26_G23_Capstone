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

// ── Permission Groups API ──────────────────────────────────────────────────────
export const getPermissionGroups = async (): Promise<IPermissionGroup[]> => {
  const { data } = await AxiosClient.get<IPermissionGroup[]>("/api/PermissionGroups");
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
