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

// ── Permissions (items under a group) ─────────────────────────────────────────
export interface IPermission {
  permissionID: number;
  groupID: number;
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

/** Row inside role matrix (matches BE PermissionDetailDto; URL not returned by matrix API). */
export interface IPermissionMatrixItem {
  permissionID: number;
  name: string;
  description?: string | null;
  isGranted: boolean;
}

/** Group block in role matrix (matches BE PermissionGroupMatrixDto). */
export interface IRolePermissionMatrix {
  groupID: number;
  groupName: string;
  permissions: IPermissionMatrixItem[];
}

// ── Permission Groups API ──────────────────────────────────────────────────────
export const getPermissionGroups = async (): Promise<IPermissionGroup[]> => {
  const { data } = await AxiosClient.get<IPermissionGroup[]>("/api/PermissionGroups");
  return data;
};

export const createPermissionGroup = async (body: IPermissionGroupRequest): Promise<void> => {
  await AxiosClient.post("/api/PermissionGroups", body);
};

export const updatePermissionGroup = async (
  id: number,
  body: IPermissionGroupRequest,
): Promise<void> => {
  await AxiosClient.put(`/api/PermissionGroups/${id}`, body);
};

export const deletePermissionGroup = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/PermissionGroups/${id}`);
};

// ── Permissions API (BE PermissionsController) ─────────────────────────────────
/**
 * Lists all permissions by loading the role matrix for roleId 1 (Admin).
 * The API returns every permission under each group; `isGranted` is ignored here.
 * URLs are not included in the matrix DTO — left empty until BE exposes them.
 */
export const getPermissions = async (): Promise<IPermission[]> => {
  const matrix = await getRolePermissionMatrix(1);
  return matrix.flatMap((g) =>
    g.permissions.map((p) => ({
      permissionID: p.permissionID,
      groupID: g.groupID,
      name: p.name,
      url: "",
      description: p.description ?? "",
    })),
  );
};

export const createPermission = async (body: IPermissionRequest): Promise<void> => {
  await AxiosClient.post("/api/Permissions", {
    name: body.name,
    url: body.url || null,
    description: body.description || null,
    groupID: body.groupID,
  });
};

export const updatePermission = async (id: number, body: IPermissionRequest): Promise<void> => {
  await AxiosClient.put(`/api/Permissions/${id}`, {
    name: body.name,
    url: body.url || null,
    description: body.description || null,
    groupID: body.groupID,
  });
};

export const deletePermission = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/Permissions/${id}`);
};

// ── Roles (BE RolesController) ────────────────────────────────────────────────
export interface IRole {
  roleID: number;
  roleName: string;
  description: string;
  isActive: boolean;
}

export const getRoles = async (): Promise<IRole[]> => {
  const { data } = await AxiosClient.get<{ message: string; data: IRole[] }>("/api/Roles");
  return data.data;
};

// ── Role ↔ Permissions (BE RolePermissionsController) ──────────────────────────
export const getRolePermissionMatrix = async (
  roleId: number,
): Promise<IRolePermissionMatrix[]> => {
  const { data } = await AxiosClient.get<IRolePermissionMatrix[]>(
    "/api/RolePermissions/matrix",
    { params: { roleId } },
  );
  return data;
};

export const updateRolePermissions = async (
  roleId: number,
  permissionIds: number[],
): Promise<void> => {
  await AxiosClient.put(
    "/api/RolePermissions/editUserPermission",
    { permissionIds },
    { params: { roleId } },
  );
};
