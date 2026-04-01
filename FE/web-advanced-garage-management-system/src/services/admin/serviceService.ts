import AxiosClient from "@/apis/AxiosClient";

export interface IService {
  id: number;
  code: string;
  name: string;
  price: number;
  unit: string | null;
  category: string;
  estimatedDurationHours: number;
  description: string;
  image: string | null;
  isActive: boolean;
}

export interface IServiceRequest {
  code: string;
  name: string;
  price: number;
  unitId: number;
  categoryID: number;
  estimatedDurationHours: number;
  description: string;
  image: string;
  isActive: boolean;
}

export interface IServicesResponse {
  items: IService[];
}

export const getServices = async (): Promise<IService[]> => {
  const { data } = await AxiosClient.get<IServicesResponse>(
    "/api/products/services"
  );
  return data.items;
};

export const createService = async (
  service: IServiceRequest
): Promise<IService> => {
  const { data } = await AxiosClient.post<IService>(
    "/api/products/services",
    service
  );
  return data;
};

export const updateService = async (
  id: number,
  service: IServiceRequest
): Promise<IService> => {
  const { data } = await AxiosClient.put<IService>(
    `/api/products/services/${id}`,
    service
  );
  return data;
};

export const serviceService = {
  getServices,
  createService,
  updateService,
};
