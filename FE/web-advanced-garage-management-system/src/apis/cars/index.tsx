/**
 * Create Car
 */

import AxiosClient from "../AxiosClient";
import type { ICar, ICreateCarPayload, ICreateCarResponse } from "./types";

export const createCar = async (payload: ICreateCarPayload) => {
  const response = await AxiosClient.post<ICreateCarResponse>(
    "api/customer/cars",
    payload
  );
  return response.data;
};

/**
 * Get Cars
 */

export const getCars = async () => {
  const response = await AxiosClient.get<ICar[]>("api/customer/cars");
  return response.data;
};

export const carService = {
  createCar,
  getCars,
};
