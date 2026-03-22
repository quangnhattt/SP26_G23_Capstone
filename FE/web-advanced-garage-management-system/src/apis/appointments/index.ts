import AxiosClient from "@/apis/AxiosClient";

export interface IAppointment {
  appointmentId: number;
  carId: number;
  appointmentDate: string;
  serviceType: string;
  requestedPackageId: number | null;
  status: string;
  notes: string | null;
  rejectionReason: string | null;
  createdBy: number;
  createdDate: string;
  licensePlate: string;
  carBrand: string;
  carModel: string;
  carYear: number;
  carColor: string;
  currentOdometer: number;
  customerFullName: string;
  customerPhone: string;
  phone: string;
  customerEmail: string;
  packageName: string | null;
  packageCode: string | null;
  packageFinalPrice: number | null;
}

export interface IAppointmentDetail {
  appointmentId: number;
  carId: number;
  appointmentDate: string;
  serviceType: string;
  requestedPackageId: number | null;
  status: string;
  notes: string | null;
  rejectionReason: string | null;
  createdBy: number;
  createdDate: string;
  confirmedBy: number | null;
  confirmedDate: string | null;
  car: {
    carId: number;
    licensePlate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    currentOdometer: number;
  };
  customer: {
    userId: number;
    fullName: string;
    phone: string;
    email: string;
  };
  package: {
    packageName: string;
    packageCode: string;
    packageFinalPrice: number;
  } | null;
  maintenance: {
    maintenanceId: number;
    maintenanceType: string;
    assignedTechnicianId: number | null;
    totalAmount: number;
    finalAmount: number;
    status: string;
  } | null;
  symptoms: string[];
  suggestedParts: string[];
}

export const getAppointments = async (): Promise<IAppointment[]> => {
  const { data } = await AxiosClient.get<IAppointment[]>("/api/appointments");
  return data;
};

export const getAppointmentById = async (id: number): Promise<IAppointmentDetail> => {
  const { data } = await AxiosClient.get<IAppointmentDetail>(`/api/appointments/${id}`);
  return data;
};

export const approveAppointment = async (id: number) => {
  const { data } = await AxiosClient.post(`/api/appointments/${id}/approve`);
  return data;
};

export const rejectAppointment = async (id: number, reason?: string) => {
  const { data } = await AxiosClient.post(`/api/appointments/${id}/reject`, {
    reason: reason,
  });
  return data;
};
