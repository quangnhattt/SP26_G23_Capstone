import AxiosClient from "@/apis/AxiosClient";

export interface IRescueRequest {
  rescueId: number;
  status: RescueStatus;
  rescueType: string | null;
  currentAddress: string;
  problemDescription: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  carId: number;
  licensePlate: string;
  brand: string;
  model: string;
  serviceAdvisorId: number | null;
  serviceAdvisorName: string | null;
  createdDate: string;
}

export type RescueStatus =
  | "PENDING"
  | "ACCEPTED"
  | "EVALUATING"
  | "QUOTE_SENT"
  | "CUSTOMER_APPROVED"
  | "CUSTOMER_REJECTED"
  | "TECHNICIAN_DISPATCHED"
  | "RESCUE_VEHICLE_DISPATCHED"
  | "DIAGNOSING"
  | "REPAIRING_ON_SITE"
  | "NEED_TOWING"
  | "TOWING_CONFIRMED"
  | "TOWING_REJECTED"
  | "INVOICED"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED"
  | "SPAM";

export interface IRescueCreatePayload {
  carId: number;
  phone: string;
  latitude: number;
  longitude: number;
  currentAddress: string;
  problemDescription: string;
  imageEvidence: string | null;
}

export interface IRescueUpdateStatusPayload {
  status: RescueStatus;
  note?: string;
}

export interface IRescueAssignTechPayload {
  technicianId: number;
}

export interface IRescueSendQuotePayload {
  quoteAmount: number;
  depositRequired: boolean;
  depositAmount?: number;
  note?: string;
}

export interface IRescueDiagnosisPayload {
  canFixOnSite: boolean;
  diagnosisNote: string;
  needTowing: boolean;
}

// Customer: Create rescue request
export const createRescueRequest = async (
  payload: IRescueCreatePayload,
) => {
  const { data } = await AxiosClient.post("/api/rescue-requests", payload);
  return data;
};

// SA: Get all rescue requests
export const getRescueRequests = async (): Promise<IRescueRequest[]> => {
  const { data } = await AxiosClient.get<IRescueRequest[]>("/api/rescue-requests");
  return data;
};

// SA: Get rescue detail
export const getRescueById = async (
  id: number,
): Promise<IRescueRequest> => {
  const { data } = await AxiosClient.get<IRescueRequest>(
    `/api/rescues/${id}`,
  );
  return data;
};

// customer: Get rescue detail
export const getRescueCustomerById = async (
  id: number,
): Promise<IRescueRequest> => {
  const { data } = await AxiosClient.get<IRescueRequest>(
    `/api/rescue-requests/${id}`,
  );
  return data;
};

// SA: Update rescue status
export const updateRescueStatus = async (
  id: number,
  payload: IRescueUpdateStatusPayload,
) => {
  const { data } = await AxiosClient.put(
    `/api/rescues/${id}/status`,
    payload,
  );
  return data;
};

// SA: Assign technician
export const assignTechnician = async (
  id: number,
  payload: IRescueAssignTechPayload,
) => {
  const { data } = await AxiosClient.put(
    `/api/rescues/${id}/assign-technician`,
    payload,
  );
  return data;
};

// SA: Send quote to customer
export const sendRescueQuote = async (
  id: number,
  payload: IRescueSendQuotePayload,
) => {
  const { data } = await AxiosClient.put(
    `/api/rescues/${id}/quote`,
    payload,
  );
  return data;
};

// Technician: Submit diagnosis
export const submitDiagnosis = async (
  id: number,
  payload: IRescueDiagnosisPayload,
) => {
  const { data } = await AxiosClient.put(
    `/api/rescues/${id}/diagnosis`,
    payload,
  );
  return data;
};

// SA: Cancel rescue request
export const cancelRescueRequest = async (
  id: number,
  reason: string,
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/cancel`,
    { reason },
  );
  return data;
};

// SA: Mark rescue request as spam
export const markSpamRescueRequest = async (
  id: number,
  spamReason: string,
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/mark-spam`,
    { spamReason },
  );
  return data;
};
