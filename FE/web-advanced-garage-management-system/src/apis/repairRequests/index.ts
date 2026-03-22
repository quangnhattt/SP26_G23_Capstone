import AxiosClient from "@/apis/AxiosClient";

export interface IRepairRequestPayload {
  carId: number;
  description: string;
  serviceType: string;
  requestedPackageId: number;
  technicianId: number | null;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  symptomIds: number[];
}

export const createRepairRequest = async (
  payload: IRepairRequestPayload
) => {
  const { data } = await AxiosClient.post("/api/repair-requests", payload);
  return data;
};
