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
  | "EN_ROUTE"
  | "ON_SITE"
  | "RESCUE_VEHICLE_DISPATCHED"
  | "DIAGNOSING"
  | "REPAIRING_ON_SITE"
  | "REPAIR_COMPLETED"
  | "NEED_TOWING"
  | "TOWING_CONFIRMED"
  | "TOWING_REJECTED"
  | "PROPOSED_ROADSIDE"
  | "PROPOSED_TOWING"
  | "INVOICED"
  | "INVOICE_SENT"
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

export interface IRescueProposePayload {
  rescueType: "ROADSIDE" | "TOWING";
  proposalNotes?: string;
  estimatedServiceFee?: number;
}

export interface IRescueAssignTechPayload {
  technicianId: number;
  estimatedArrivalDateTime: string;
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

// SA: Propose rescue option to customer
export const proposeRescueToCustomer = async (
  id: number,
  payload: IRescueProposePayload,
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/propose`,
    payload,
  );
  return data;
};

// SA: Assign technician
export const assignTechnician = async (
  id: number,
  payload: IRescueAssignTechPayload,
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/assign-technician`,
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

// Technician: Accept job
export const acceptRescueJob = async (id: number) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/accept-job`,
  );
  return data;
};

// Technician: Arrive on site
export const arriveRescue = async (id: number) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/arrive`,
  );
  return data;
};

// Customer: Consent on-site repair
export const customerConsent = async (id: number) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/customer-consent`,
  );
  return data;
};

// Technician: Start diagnosis
export interface IRescueStartDiagnosisPayload {
  diagnosisNotes: string;
  canRepairOnSite: boolean;
}

export const startDiagnosis = async (
  id: number,
  payload: IRescueStartDiagnosisPayload,
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/start-diagnosis`,
    payload,
  );
  return data;
};

// Technician: Add repair items
export interface IRescueRepairItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface IRescueRepairItemsPayload {
  items: IRescueRepairItem[];
}

export const addRepairItems = async (
  id: number,
  payload: IRescueRepairItemsPayload,
) => {
  const { data } = await AxiosClient.post(
    `/api/rescue-requests/${id}/repair-items`,
    payload,
  );
  return data;
};

// Technician: Complete repair
export const completeRepair = async (
  id: number,
  payload: { completionNotes?: string },
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/complete-repair`,
    payload,
  );
  return data;
};

// SA: Create invoice
export interface IRescueInvoicePayload {
  rescueServiceFee: number;
  manualDiscount: number;
  notes?: string;
}

export const createRescueInvoice = async (
  id: number,
  payload: IRescueInvoicePayload,
) => {
  const { data } = await AxiosClient.post(
    `/api/rescue-requests/${id}/invoice`,
    payload,
  );
  return data;
};

// SA: Send invoice to customer
export const sendRescueInvoice = async (id: number) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/invoice/send`,
  );
  return data;
};

// Customer: Make payment
export interface IRescuePaymentPayload {
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "EWALLET";
  amount: number;
  transactionReference?: string;
}

export const makeRescuePayment = async (
  id: number,
  payload: IRescuePaymentPayload,
) => {
  const { data } = await AxiosClient.post(
    `/api/rescue-requests/${id}/invoice/payment`,
    payload,
  );
  return data;
};
