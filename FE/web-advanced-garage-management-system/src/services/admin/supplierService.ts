import AxiosClient from "@/apis/AxiosClient";

export interface ISupplier {
  supplierID: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  isActive: boolean;
  createdDate: string;
}

export interface ISupplierCreateRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
}

export interface ISupplierUpdateRequest extends ISupplierCreateRequest {
  isActive: boolean;
}

export interface ISuppliersResponse {
  items: ISupplier[];
  totalCount: number;
  systemMessage: string | null;
}

export const getSuppliers = async (): Promise<ISuppliersResponse> => {
  const { data } = await AxiosClient.get<ISuppliersResponse>("/api/Suppliers");
  return data;
};

export const createSupplier = async (
  supplier: ISupplierCreateRequest
): Promise<ISupplier> => {
  const { data } = await AxiosClient.post<ISupplier>(
    "/api/Suppliers",
    supplier
  );
  return data;
};

export const updateSupplier = async (
  id: number,
  supplier: ISupplierUpdateRequest
): Promise<ISupplier> => {
  const { data } = await AxiosClient.put<ISupplier>(
    `/api/Suppliers/${id}`,
    supplier
  );
  return data;
};
