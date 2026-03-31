import AxiosClient from "@/apis/AxiosClient";
import type { ICar, ICreateCarPayload, ICreateCarResponse } from "./types";

export const getCars = async (): Promise<ICar[]> => {
  const { data } = await AxiosClient.get<ICar[]>("/api/customer/cars");
  return data;
};

export const getCarsByCustomerId = async (customerId: number): Promise<ICar[]> => {
  const { data } = await AxiosClient.get<ICar[]>("/api/customer/cars", {
    params: { customerId },
  });
  return data;
};

export const getCarById = async (id: number): Promise<ICar> => {
  const { data } = await AxiosClient.get<ICar>(`/api/customer/cars/${id}`);
  return data;
};

export const createCar = async (
  payload: ICreateCarPayload
): Promise<ICreateCarResponse> => {
  const { data } = await AxiosClient.post<ICreateCarResponse>(
    "/api/customer/cars",
    payload
  );
  return data;
};

export const updateCar = async (
  id: number,
  payload: ICreateCarPayload
): Promise<ICar> => {
  const { data } = await AxiosClient.put<ICar>(`/api/customer/cars/${id}`, payload);
  return data;
};

export const deleteCar = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/customer/cars/${id}`);
};

export const carService = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
};
