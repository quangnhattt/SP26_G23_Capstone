import AxiosClient from "@/apis/AxiosClient";

export interface IIntakeItem {
  maintenanceId: number;
  customerName: string;
  carInfo: string;
  maintenanceDate: string;
  completedDate: string | null;
  maintenanceType: string;
  status: string;
  technicianName: string;
}

export interface IIntakeParams {
  maintenanceType?: string;
  customerName?: string;
  page?: number;
  pageSize?: number;
}

export interface IIntakeResponse {
  items: IIntakeItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export const getIntakeList = async (
  params: IIntakeParams
): Promise<IIntakeResponse> => {
  const { data } = await AxiosClient.get<IIntakeResponse>("/api/intake", {
    params,
  });
  return data;
};

export interface IIntakeCustomer {
  userCode: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string | null;
  dob: string;
}

export interface IIntakeCar {
  licensePlate: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  carDetails: string;
  engineNumber: string;
  chassisNumber?: string | null;
  currentOdometer: number;
}

export interface IIntakePackage {
  packageId: number;
  packageCode: string;
  packageName: string;
  packagePrice: number;
}

export interface IServiceDetail {
  serviceProductId: number;
  serviceProductCode: string;
  serviceProductName: string;
  serviceQty: number;
  servicePrice: number;
  serviceStatus: string;
  isServiceAdditional: boolean;
  serviceNotes: string;
}

export interface IPartDetail {
  partProductId: number;
  partProductCode: string;
  partProductName: string;
  partQty: number;
  partPrice: number;
  partStatus: string;
  isPartAdditional: boolean;
  partNotes: string;
}

export interface IVehicleIntakeCondition {
  intakeConditionId: number;
  checkInTime: string;
  frontStatus: string;
  rearStatus: string;
  leftStatus: string;
  rightStatus: string;
  roofStatus: string;
  intakeConditionNote: string;
}

export interface IIntakeDetail {
  maintenanceId: number;
  maintenanceDate: string;
  maintenanceStatus: string;
  maintenanceType?: string;
  technicianId?: number;
  technicianName?: string;
  technicianPhone?: string;
  technicianEmail?: string;
  customer: IIntakeCustomer;
  car: IIntakeCar;
  package: IIntakePackage | null;
  serviceDetails: IServiceDetail[];
  partDetails: IPartDetail[];
  vehicleIntakeConditions: IVehicleIntakeCondition[];
}

export const getIntakeDetail = async (id: number): Promise<IIntakeDetail> => {
  const { data } = await AxiosClient.get<IIntakeDetail>(`/api/intake/${id}`);
  return data;
};

// ─── Create / Update payloads ────────────────────────────────────────────────

export interface ICreateIntakePayload {
  customer: {
    mode: "existing" | "new";
    customerId?: number;
    fullName?: string;
    phone?: string;
    email?: string;
  };
  car: {
    mode: "existing" | "new";
    carId?: number;
    licensePlate?: string;
    brand?: string;
    model?: string;
    year?: number;
    currentOdometer?: number;
    color?: string;
    engineNumber?: string;
    chassisNumber?: string;
  };
  maintenance: {
    maintenanceType: string;
    notes: string;
    assignedTechnicianId: number;
    bayId: number | null;
  };
  packageSelection: { selectedPackageId: number | null };
  serviceDetails: { productId: number; quantity: number; notes: string }[];
  partDetails: { productId: number; quantity: number; notes: string }[];
  vehicleIntakeConditions: {
    frontStatus: string;
    rearStatus: string;
    leftStatus: string;
    rightStatus: string;
    roofStatus: string;
    conditionNote: string;
  }[];
}

export interface IUpdateIntakePayload {
  maintenance: {
    maintenanceType: string;
    notes: string;
    assignedTechnicianId: number;
    bayId: number | null;
  };
  customer: {
    fullName: string;
    phone: string;
    email: string;
    gender: string;
    dob: string;
  }[];
  car: {
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    engineNumber: string;
    chassisNumber: string;
    currentOdometer: number;
  };
  packageSelection: { selectedPackageId: number | null };
  serviceDetails: { productId: number; quantity: number; notes: string }[];
  partDetails: { productId: number; quantity: number; notes: string }[];
  vehicleCondition: {
    frontStatus: string;
    rearStatus: string;
    leftStatus: string;
    rightStatus: string;
    roofStatus: string;
    conditionNotes: string;
  }[];
}

export const createIntake = async (payload: ICreateIntakePayload): Promise<void> => {
  await AxiosClient.post("/api/intake/walk-in", payload);
};

export const updateIntake = async (id: number, payload: IUpdateIntakePayload): Promise<void> => {
  await AxiosClient.put(`/api/intake/${id}`, payload);
};
