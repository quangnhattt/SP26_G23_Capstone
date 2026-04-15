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
  maintenanceId?: number | null;
  maintenanceStatus?: string | null;
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
  symptoms: {
    id: number;
    code: string;
    name: string;
    description: string;
  }[];
  suggestedParts: {
    productId: number;
    code: string;
    name: string;
    price: number;
    score: number;
  }[];
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

// === Scheduling: Khung giờ đặt lịch ===

export interface ISlotAvailability {
  slotIndex: number;
  startTime: string;
  endTime: string;
  bookedCount: number;
  capacity: number;
  availableCount: number;
  isAvailable: boolean;
}

export interface IDayAvailability {
  date: string;
  totalTechnicians: number;
  slots: ISlotAvailability[];
}

export interface ISlotTechnician {
  technicianId: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  skills: string | null;
  isAvailableInSlot: boolean;
  currentJobCount?: number;
}

export const getAvailableSlots = async (date: string): Promise<IDayAvailability> => {
  const { data } = await AxiosClient.get<IDayAvailability>(
    `/api/appointments/available-slots?date=${date}`
  );
  return data;
};

export const getAvailableTechnicians = async (
  date: string,
  time: string
): Promise<ISlotTechnician[]> => {
  const { data } = await AxiosClient.get<ISlotTechnician[]>(
    `/api/appointments/available-technicians?date=${date}&time=${time}`
  );
  return data;
};

// === Reschedule ===

export const proposeReschedule = async (id: number, reason: string) => {
  const { data } = await AxiosClient.post(`/api/appointments/${id}/propose-reschedule`, {
    reason,
  });
  return data;
};

export interface IRespondReschedulePayload {
  accept: boolean;
  newDate?: string;  // yyyy-MM-dd, bắt buộc nếu accept = true
  newTime?: string;  // HH:mm, bắt buộc nếu accept = true
  notes?: string;
}

export const respondReschedule = async (id: number, payload: IRespondReschedulePayload) => {
  const { data } = await AxiosClient.post(`/api/appointments/${id}/respond-reschedule`, payload);
  return data;
};

export const checkInAppointment = async (id: number) => {
  const { data } = await AxiosClient.post(`/api/appointments/${id}/check-in`);
  return data;
};
