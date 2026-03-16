import AxiosClient from "@/apis/AxiosClient";

export interface IMenuPermission {
  permissionID: number;
  name: string;
  url: string;
}

export interface IMenuGroup {
  groupID: number;
  groupName: string;
  items?: IMenuPermission[];
}

export type IMenuAccessResponse = IMenuGroup[];

export const getMenuAccess = async (): Promise<IMenuAccessResponse> => {
  const { data } = await AxiosClient.get<IMenuAccessResponse>(
    "/api/menu-access"
  );
  return data;
};

export const hasPermission = (
  menuGroups: IMenuGroup[],
  permissionName: string
): boolean => {
  return menuGroups.some((group) =>
    group.items.some((item) => item.name === permissionName)
  );
};

export const getAllPermissions = (menuGroups: IMenuGroup[]): string[] => {
  return menuGroups.flatMap((group) => group.items.map((item) => item.name));
};

export const getPermissionsByGroup = (
  menuGroups: IMenuGroup[],
  groupID: number
): IMenuPermission[] => {
  const group = menuGroups.find((g) => g.groupID === groupID);
  return group?.items || [];
};

export const menuService = {
  getMenuAccess,
  hasPermission,
  getAllPermissions,
  getPermissionsByGroup,
};
