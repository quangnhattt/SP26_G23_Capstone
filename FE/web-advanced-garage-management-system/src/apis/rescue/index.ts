import AxiosClient from "@/apis/AxiosClient";

// ─── Types / Interfaces ───────────────────────────────────────

export interface IRescueInvoiceData {
  rescueServiceFee: number;
  manualDiscount: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export interface IRescueSuggestedPartDetail {
  partId: number;
  partCode?: string;
  partName?: string;
  partType?: string;
  quantity: number;
  unitPrice?: number;
  estimatedLineAmount?: number;
}

export interface IRescueSuggestedServiceDetail {
  serviceId: number;
  serviceName?: string;
  price?: number;
}

export interface IRepairItemDetail {
  productId: number;
  productCode?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  notes?: string;
}

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
  proposalNotes?: string;
  estimatedServiceFee?: number;
  depositAmount?: number;
  requiresDeposit?: boolean;
  isDepositPaid?: boolean;
  depositPaidDate?: string | null;
  isDepositConfirmed?: boolean;
  depositConfirmedDate?: string | null;
  depositConfirmedById?: number | null;
  serviceFee?: number;
  suggestedParts?: IRescueSuggestedPartDetail[];
  suggestedServices?: IRescueSuggestedServiceDetail[];
  repairItems?: IRepairItemDetail[];
  invoice?: IRescueInvoiceData;
}

export type RescueStatus =
  | "PENDING"
  | "PROPOSED_ROADSIDE"
  | "PROPOSED_TOWING"
  | "PROPOSAL_ACCEPTED"
  | "EN_ROUTE"
  | "ON_SITE"
  | "DIAGNOSING"
  | "REPAIRING"
  | "REPAIR_COMPLETE"
  | "TOWING_DISPATCHED"
  | "TOWING_ACCEPTED"
  | "TOWED"
  | "INVOICED"
  | "INVOICE_SENT"
  | "PAYMENT_PENDING"
  | "PAYMENT_SUBMITTED"
  | "COMPLETED"
  | "CANCELLED"
  | "SPAM";

export interface IRescueCreatePayload {
  carId: number;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  currentAddress: string;
  problemDescription: string;
  imageEvidence: string | null;
}

export interface IRescueUpdateStatusPayload {
  status: RescueStatus;
  note?: string;
}

export interface IRescueSuggestedPart {
  partId: number;
  quantity: number;
}

export interface IRescueSuggestedService {
  serviceId: number;
}

export interface IRescueProposePayload {
  rescueType: "ROADSIDE" | "TOWING";
  proposalNotes?: string;
  estimatedServiceFee?: number;
  depositAmount?: number;
  suggestedParts?: IRescueSuggestedPart[];
  suggestedServices?: IRescueSuggestedService[];
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

export interface IRescueCustomerConsentPayload {
  consentGiven: boolean;
  consentNotes?: string;
}

export interface IRescueStartDiagnosisPayload {
  diagnosisNotes: string;
  canRepairOnSite: boolean;
}

export interface IRescueRepairItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface IRescueRepairItemsPayload {
  actorId?: number;
  items: IRescueRepairItem[];
}

export interface IRescueDispatchTowingPayload {
  towingNotes?: string;
  estimatedArrival?: string;
  towingServiceFee?: number;
}

export interface IRescueCompleteTowingPayload {
  repairOrderNotes?: string;
}

export interface IRescueInvoicePayload {
  rescueServiceFee: number;
  manualDiscount: number;
  notes?: string;
}

export interface IRescuePaymentPayload {
  paymentMethod: "CASH" | "CARD" | "TRANSFER" | "EWALLET";
  amount: number;
  transactionReference?: string;
}

// ─── API functions ────────────────────────────────────────────

// Customer: Create rescue request
export const createRescueRequest = async (
  payload: IRescueCreatePayload,
): Promise<IRescueRequest> => {
  const { data } = await AxiosClient.post("/api/rescue-requests", payload);
  return data;
};

// SA: Get all rescue requests
export const getRescueRequests = async (): Promise<IRescueRequest[]> => {
  const { data } = await AxiosClient.get<IRescueRequest[]>("/api/rescue-requests");
  return data;
};

// SA: Get rescue detail
export const getRescueById = async (id: number): Promise<IRescueRequest> => {
  const { data } = await AxiosClient.get<IRescueRequest>(`/api/rescues/${id}`);
  return data;
};

// Customer: Get rescue detail
export const getRescueCustomerById = async (id: number): Promise<IRescueRequest> => {
  const { data } = await AxiosClient.get<IRescueRequest>(`/api/rescue-requests/${id}`);
  return data;
};

// SA: Update rescue status
export const updateRescueStatus = async (
  id: number,
  payload: IRescueUpdateStatusPayload,
) => {
  const { data } = await AxiosClient.put(`/api/rescues/${id}/status`, payload);
  return data;
};

// SA: Propose rescue option to customer
export const proposeRescueToCustomer = async (
  id: number,
  payload: IRescueProposePayload,
) => {
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/propose`, payload);
  return data;
};

// Customer: Accept proposal → DISPATCHED / TOWING_DISPATCHED
export const acceptProposal = async (id: number) => {
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/accept-proposal`);
  return data;
};

export interface IAvailableTechnician {
  userId: number;
  fullName: string;
  phone: string;
  skills: string;
  isOnRescueMission: boolean;
  activeJobCount: number;
}

// SA: Get available technicians for a rescue request
export const getAvailableTechnicians = async (id: number): Promise<IAvailableTechnician[]> => {
  const { data } = await AxiosClient.get(`/api/rescue-requests/${id}/available-technicians`);
  return data?.data ?? data;
};

// SA: Assign technician → DISPATCHED
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
  const { data } = await AxiosClient.put(`/api/rescues/${id}/quote`, payload);
  return data;
};

// Technician: Submit diagnosis
export const submitDiagnosis = async (
  id: number,
  payload: IRescueDiagnosisPayload,
) => {
  const { data } = await AxiosClient.put(`/api/rescues/${id}/diagnosis`, payload);
  return data;
};

// SA: Cancel rescue request → CANCELLED
export const cancelRescueRequest = async (id: number, reason: string) => {
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/cancel`, {
    reason,
  });
  return data;
};

// SA: Mark rescue request as spam → SPAM
export const markSpamRescueRequest = async (id: number, spamReason: string) => {
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/mark-spam`, {
    spamReason,
  });
  return data;
};

// Technician: Arrive on site → ON_SITE
export const arriveRescue = async (id: number) => {
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/arrive`);
  return data;
};

// Customer: Consent on-site repair → REPAIRING
export const customerConsent = async (
  id: number,
  payload: IRescueCustomerConsentPayload,
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/customer-consent`,
    payload,
  );
  return data;
};

// Technician: Start diagnosis → DIAGNOSING
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

// Technician: Complete repair → REPAIR_COMPLETE
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

// SA: Create invoice → INVOICED
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

// SA: Send invoice to customer → INVOICE_SENT
export const sendRescueInvoice = async (id: number) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/invoice/send`,
  );
  return data;
};

// SA: Dispatch towing service → TOWING_DISPATCHED
export const dispatchTowing = async (
  id: number,
  payload: IRescueDispatchTowingPayload,
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/dispatch-towing`,
    payload,
  );
  return data;
};

// Customer: Accept towing → TOWING_ACCEPTED
export const acceptTowing = async (id: number) => {
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/accept-towing`);
  return data;
};

// SA: Complete towing (car arrived at garage) → TOWED
export const completeTowing = async (
  id: number,
  payload: IRescueCompleteTowingPayload,
) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/complete-towing`,
    payload,
  );
  return data;
};

// Customer: Pay deposit → isDepositPaid = true
export const makeRescueDeposit = async (
  id: number,
  payload: IRescuePaymentPayload,
) => {
  const { data } = await AxiosClient.post(
    `/api/rescue-requests/${id}/deposit`,
    payload,
  );
  return data;
};

// SA: Confirm deposit received from customer
export const confirmRescueDeposit = async (id: number) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/deposit/confirm`,
  );
  return data;
};

// Customer: Make payment → PAYMENT_SUBMITTED
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

// SA: Confirm payment received → COMPLETED
export const confirmRescuePayment = async (id: number) => {
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/invoice/payment/confirm`,
  );
  return data;
};
