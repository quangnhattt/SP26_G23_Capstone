import AxiosClient from "@/apis/AxiosClient";

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
