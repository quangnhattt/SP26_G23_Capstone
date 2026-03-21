import AxiosClient from "@/apis/AxiosClient";

export interface ISymptom {
  id: number;
  name: string;
}

export const getSymptoms = async (): Promise<ISymptom[]> => {
  const { data } = await AxiosClient.get<ISymptom[]>("/api/symptoms");
  return data;
};
