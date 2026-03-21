export interface ICreateCarPayload {
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  purchaseDate: string;
  currentOdometer: number;
}

export interface ICreateCarResponse {
  carId: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  purchaseDate: string;
  currentOdometer: number;
}

export interface ICar {
  carId: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  purchaseDate: string;
  currentOdometer: number;
  customerId: number;
  createdDate?: string;
}
