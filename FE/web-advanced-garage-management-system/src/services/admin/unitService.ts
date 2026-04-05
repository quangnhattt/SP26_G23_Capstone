import AxiosClient from "@/apis/AxiosClient";

export interface IUnit {
  unitID: number;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
}

export interface IUnitCreateRequest {
  name: string;
  type: string;
  description: string;
}

export interface IUnitUpdateRequest {
  name: string;
  type: string;
  description: string;
  isActive: boolean;
}

interface IUnitsResponse {
  items: IUnit[];
  totalCount: number;
  systemMessage: string | null;
}

export const getUnits = async (params?: { type?: string }): Promise<IUnit[]> => {
  const { data } = await AxiosClient.get<IUnitsResponse>("/api/Units", { params });
  return data.items;
};

export const createUnit = async (unit: IUnitCreateRequest): Promise<IUnit> => {
  const { data } = await AxiosClient.post<IUnit>("/api/Units", unit);
  return data;
};

export const updateUnit = async (id: number, unit: IUnitUpdateRequest): Promise<IUnit> => {
  const { data } = await AxiosClient.put<IUnit>(`/api/Units/${id}`, unit);
  return data;
};

export const updateUnitStatus = async (id: number, isActive: boolean): Promise<void> => {
  await AxiosClient.patch(`/api/Units/${id}/status`, { isActive });
};

export const deleteUnit = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/Units/${id}`);
};
