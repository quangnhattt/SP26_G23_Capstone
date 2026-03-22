import AxiosClient from "@/apis/AxiosClient";

export interface ITechnician {
  technicianId: number;
  fullName: string;
  email: string;
  phone: string;
  skills: string | null;
}

export const getTechnicians = async (): Promise<ITechnician[]> => {
  const { data } = await AxiosClient.get<ITechnician[]>("/api/technicians");
  return data;
};
