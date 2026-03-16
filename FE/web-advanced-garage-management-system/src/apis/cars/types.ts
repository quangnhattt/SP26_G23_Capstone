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
  carID: number;
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
  carID: number;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  purchaseDate: string;
  currentOdometer: number;
  customerID: number;
  createdDate?: string;
}
