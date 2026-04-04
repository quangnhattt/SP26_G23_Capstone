import AxiosClient from "@/apis/AxiosClient";

// Minimal interface (kept for backwards compat with intake form)
export interface IPackage {
  packageID: number;
  packageCode: string;
  name: string;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  isActive: boolean;
}

export const getPackages = async (): Promise<IPackage[]> => {
  const { data } = await AxiosClient.get<IPackage[]>("/api/maintenance-packages");
  return data;
};

// Full interfaces for management page
export interface IMaintenancePackage {
  packageID: number;
  packageCode: string;
  name: string;
  description: string | null;
  kilometerMilestone: number | null;
  monthMilestone: number | null;
  basePrice: number;
  discountPercent: number;
  finalPrice: number;
  estimatedDurationHours: number | null;
  applicableBrands: string | null;
  image: string | null;
  displayOrder: number;
  isActive: boolean;
  createdDate?: string;
  createdBy?: string | null;
}

export interface IPackageProduct {
  packageDetailID: number;
  packageID: number;
  productID: number;
  productName: string;
  quantity: number;
  isRequired: boolean;
  productStatus: boolean;
  displayOrder: number;
  notes?: string | null;
}

export interface IMaintenancePackageWithProducts extends IMaintenancePackage {
  products: IPackageProduct[];
}

export interface IMaintenancePackageRequest {
  packageCode: string;
  name: string;
  description?: string;
  kilometerMilestone?: number | null;
  monthMilestone?: number | null;
  basePrice: number;
  discountPercent?: number;
  estimatedDurationHours?: number | null;
  applicableBrands?: string;
  image?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface IPackageDetailRequest {
  productId: number;
  quantity: number;
  isRequired?: boolean;
  displayOrder?: number;
  notes?: string;
}

export const getMaintenancePackages = async (): Promise<IMaintenancePackage[]> => {
  const { data } = await AxiosClient.get<IMaintenancePackage[]>("/api/maintenance-packages");
  return data;
};

export const getMaintenancePackageWithProducts = async (
  packageId: number,
): Promise<IMaintenancePackageWithProducts> => {
  const { data } = await AxiosClient.get<IMaintenancePackageWithProducts>(
    `/api/maintenance-packages/${packageId}/details`,
  );
  return data;
};

export const createMaintenancePackage = async (
  pkg: IMaintenancePackageRequest,
): Promise<IMaintenancePackage> => {
  const { data } = await AxiosClient.post<IMaintenancePackage>(
    "/api/maintenance-packages",
    pkg,
  );
  return data;
};

export const updateMaintenancePackage = async (
  id: number,
  pkg: IMaintenancePackageRequest,
): Promise<IMaintenancePackage> => {
  const { data } = await AxiosClient.put<IMaintenancePackage>(
    `/api/maintenance-packages/${id}`,
    pkg,
  );
  return data;
};

export const updateMaintenancePackageStatus = async (
  id: number,
  isActive: boolean,
): Promise<IMaintenancePackage> => {
  const { data } = await AxiosClient.patch<IMaintenancePackage>(
    `/api/maintenance-packages/${id}/status`,
    { isActive },
  );
  return data;
};

export const addPackageDetail = async (
  packageId: number,
  detail: IPackageDetailRequest,
): Promise<IPackageProduct> => {
  const { data } = await AxiosClient.post<IPackageProduct>(
    `/api/maintenance-packages/${packageId}/details`,
    detail,
  );
  return data;
};

export const updatePackageDetail = async (
  detailId: number,
  detail: IPackageDetailRequest,
): Promise<IPackageProduct> => {
  const { data } = await AxiosClient.put<IPackageProduct>(
    `/api/maintenance-packages/details/${detailId}`,
    detail,
  );
  return data;
};
