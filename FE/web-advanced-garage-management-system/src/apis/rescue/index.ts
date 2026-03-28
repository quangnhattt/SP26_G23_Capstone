import AxiosClient from "@/apis/AxiosClient";

// ─── Toggle mock mode ─────────────────────────────────────────
// Set USE_MOCK = false khi backend đã hoàn thiện
const USE_MOCK = true;

// ─── Types / Interfaces ───────────────────────────────────────

export interface IRescueInvoiceData {
  rescueServiceFee: number;
  manualDiscount: number;
  total: number;
  notes?: string;
  createdAt: string;
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
  invoice?: IRescueInvoiceData;
}

export type RescueStatus =
  | "PENDING"
  | "REVIEWING"
  | "PROPOSED_ROADSIDE"
  | "PROPOSED_TOWING"
  | "DISPATCHED"
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
  | "COMPLETED"
  | "CANCELLED"
  | "SPAM"
  | "CUSTOMER_REJECTED"
  | "TOWING_REJECTED";

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

// ─── Mock localStorage store ──────────────────────────────────
//
// Dùng localStorage để share state giữa các tab (SA / KTV / Customer).
// Để reset về ban đầu, gõ trong console: window.__resetMockRescues()
//
// LUỒNG TEST:
//  Kịch bản 1 — ROADSIDE (Rescue #1 - Toyota Camry):
//    PENDING → PROPOSED_ROADSIDE → DISPATCHED → EN_ROUTE → ON_SITE
//    → DIAGNOSING → REPAIRING → REPAIR_COMPLETE → INVOICED → INVOICE_SENT → COMPLETED
//
//  Kịch bản 2 — TOWING (Rescue #2 - Ford Ranger):
//    PENDING → PROPOSED_TOWING → TOWING_DISPATCHED → TOWING_ACCEPTED
//    → TOWED → INVOICED → INVOICE_SENT → COMPLETED
// ─────────────────────────────────────────────────────────────

const _STORE_KEY = "sp26_rescue_mock_v1";
const _NEXT_ID_KEY = "sp26_rescue_mock_nextId";

const _INITIAL_RESCUES: IRescueRequest[] = [
  {
    rescueId: 1,
    status: "PENDING",
    rescueType: null,
    currentAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    problemDescription: "Xe Toyota Camry không nổ máy, nghi pin ắc quy yếu — đang đỗ trước siêu thị Vincom",
    customerId: 10,
    customerName: "Nguyễn Văn Khách",
    customerPhone: "0901234567",
    carId: 1,
    licensePlate: "51A-99999",
    brand: "Toyota",
    model: "Camry 2022",
    serviceAdvisorId: null,
    serviceAdvisorName: null,
    createdDate: new Date().toISOString(),
  },
  {
    rescueId: 2,
    status: "PENDING",
    rescueType: null,
    currentAddress: "200 Phạm Văn Đồng, Thủ Đức, TP.HCM",
    problemDescription: "Xe Ford Ranger bị hỏng hộp số, không thể di chuyển — cần kéo về xưởng để kiểm tra",
    customerId: 11,
    customerName: "Trần Thị Lan",
    customerPhone: "0912345678",
    carId: 2,
    licensePlate: "51B-88888",
    brand: "Ford",
    model: "Ranger 2021",
    serviceAdvisorId: null,
    serviceAdvisorName: null,
    createdDate: new Date(Date.now() - 300000).toISOString(),
  },
];

const _readStore = (): IRescueRequest[] => {
  try {
    const raw = localStorage.getItem(_STORE_KEY);
    if (raw) return JSON.parse(raw) as IRescueRequest[];
  } catch {
    // ignore parse errors
  }
  // first run — seed localStorage
  localStorage.setItem(_STORE_KEY, JSON.stringify(_INITIAL_RESCUES));
  return _INITIAL_RESCUES;
};

const _writeStore = (rescues: IRescueRequest[]): void => {
  localStorage.setItem(_STORE_KEY, JSON.stringify(rescues));
};

const _getNextId = (): number => {
  const current = parseInt(localStorage.getItem(_NEXT_ID_KEY) ?? "3", 10);
  localStorage.setItem(_NEXT_ID_KEY, String(current + 1));
  return current;
};

// Expose reset helper for browser console: window.__resetMockRescues()
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__resetMockRescues = () => {
    localStorage.removeItem(_STORE_KEY);
    localStorage.removeItem(_NEXT_ID_KEY);
    console.log("[Mock] Rescue store reset — reload the page to see fresh data.");
  };
}

const _delay = (ms = 600) => new Promise<void>((r) => setTimeout(r, ms));

const _findRescue = (id: number): IRescueRequest | undefined =>
  _readStore().find((r) => r.rescueId === id);

const _setStatus = (id: number, status: RescueStatus): void => {
  const rescues = _readStore();
  const r = rescues.find((x) => x.rescueId === id);
  if (r) {
    r.status = status;
    _writeStore(rescues);
  }
};

// ─── API functions ────────────────────────────────────────────

// Customer: Create rescue request
export const createRescueRequest = async (
  payload: IRescueCreatePayload,
): Promise<IRescueRequest> => {
  if (USE_MOCK) {
    await _delay();
    const newRescue: IRescueRequest = {
      rescueId: _getNextId(),
      status: "PENDING",
      rescueType: null,
      currentAddress: payload.currentAddress,
      problemDescription: payload.problemDescription,
      customerId: 10,
      customerName: "Khách hàng Demo",
      customerPhone: payload.phone,
      carId: payload.carId,
      licensePlate: "51C-MOCK",
      brand: "Demo Brand",
      model: "Demo Model",
      serviceAdvisorId: null,
      serviceAdvisorName: null,
      createdDate: new Date().toISOString(),
    };
    const rescues = _readStore();
    rescues.push(newRescue);
    _writeStore(rescues);
    return newRescue;
  }
  const { data } = await AxiosClient.post("/api/rescue-requests", payload);
  return data;
};

// SA: Get all rescue requests
export const getRescueRequests = async (): Promise<IRescueRequest[]> => {
  if (USE_MOCK) {
    await _delay();
    return [..._readStore()];
  }
  const { data } = await AxiosClient.get<IRescueRequest[]>("/api/rescue-requests");
  return data;
};

// SA: Get rescue detail
export const getRescueById = async (id: number): Promise<IRescueRequest> => {
  if (USE_MOCK) {
    await _delay();
    const r = _findRescue(id);
    if (!r) throw new Error("Rescue not found");
    return { ...r };
  }
  const { data } = await AxiosClient.get<IRescueRequest>(`/api/rescues/${id}`);
  return data;
};

// Customer: Get rescue detail
export const getRescueCustomerById = async (id: number): Promise<IRescueRequest> => {
  if (USE_MOCK) {
    await _delay();
    const r = _findRescue(id);
    if (!r) throw new Error("Rescue not found");
    return { ...r };
  }
  const { data } = await AxiosClient.get<IRescueRequest>(`/api/rescue-requests/${id}`);
  return data;
};

// SA: Update rescue status
export const updateRescueStatus = async (
  id: number,
  payload: IRescueUpdateStatusPayload,
) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, payload.status);
    return { message: "Status updated" };
  }
  const { data } = await AxiosClient.put(`/api/rescues/${id}/status`, payload);
  return data;
};

// SA: Propose rescue option to customer
export const proposeRescueToCustomer = async (
  id: number,
  payload: IRescueProposePayload,
) => {
  if (USE_MOCK) {
    await _delay();
    const status: RescueStatus =
      payload.rescueType === "ROADSIDE" ? "PROPOSED_ROADSIDE" : "PROPOSED_TOWING";
    _setStatus(id, status);
    return { message: "Proposal sent" };
  }
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/propose`, payload);
  return data;
};

// SA: Assign technician → DISPATCHED
export const assignTechnician = async (
  id: number,
  payload: IRescueAssignTechPayload,
) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "DISPATCHED");
    return { message: "Technician assigned" };
  }
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
  if (USE_MOCK) {
    await _delay();
    return { message: "Quote sent" };
  }
  const { data } = await AxiosClient.put(`/api/rescues/${id}/quote`, payload);
  return data;
};

// Technician: Submit diagnosis
export const submitDiagnosis = async (
  id: number,
  payload: IRescueDiagnosisPayload,
) => {
  if (USE_MOCK) {
    await _delay();
    return { message: "Diagnosis submitted" };
  }
  const { data } = await AxiosClient.put(`/api/rescues/${id}/diagnosis`, payload);
  return data;
};

// SA: Cancel rescue request → CANCELLED
export const cancelRescueRequest = async (id: number, reason: string) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "CANCELLED");
    return { message: "Cancelled" };
  }
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/cancel`, {
    reason,
  });
  return data;
};

// SA: Mark rescue request as spam → CANCELLED
export const markSpamRescueRequest = async (id: number, spamReason: string) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "CANCELLED");
    return { message: "Marked as spam" };
  }
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/mark-spam`, {
    spamReason,
  });
  return data;
};

// Technician: Accept job → EN_ROUTE
export const acceptRescueJob = async (id: number) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "EN_ROUTE");
    return { message: "Job accepted" };
  }
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/accept-job`);
  return data;
};

// Technician: Arrive on site → ON_SITE
export const arriveRescue = async (id: number) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "ON_SITE");
    return { message: "Arrived on site" };
  }
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/arrive`);
  return data;
};

// Customer: Consent on-site repair → REPAIRING
export const customerConsent = async (
  id: number,
  payload: IRescueCustomerConsentPayload,
) => {
  if (USE_MOCK) {
    await _delay();
    if (payload.consentGiven) _setStatus(id, "REPAIRING");
    return { message: "Customer consented" };
  }
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
  if (USE_MOCK) {
    await _delay();
    const rescues = _readStore();
    const r = rescues.find((x) => x.rescueId === id);
    if (r) {
      r.status = "DIAGNOSING";
      r.rescueType = payload.canRepairOnSite ? "ROADSIDE" : "TOWING";
      _writeStore(rescues);
    }
    return { message: "Diagnosis started" };
  }
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
  if (USE_MOCK) {
    await _delay();
    return { message: "Repair items added" };
  }
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
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "REPAIR_COMPLETE");
    return { message: "Repair completed" };
  }
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
  if (USE_MOCK) {
    await _delay();
    const rescues = _readStore();
    const r = rescues.find((x) => x.rescueId === id);
    if (r) {
      r.status = "INVOICED";
      r.invoice = {
        rescueServiceFee: payload.rescueServiceFee,
        manualDiscount: payload.manualDiscount,
        total: payload.rescueServiceFee - (payload.manualDiscount || 0),
        notes: payload.notes,
        createdAt: new Date().toISOString(),
      };
      _writeStore(rescues);
    }
    return { message: "Invoice created" };
  }
  const { data } = await AxiosClient.post(
    `/api/rescue-requests/${id}/invoice`,
    payload,
  );
  return data;
};

// SA: Send invoice to customer → INVOICE_SENT
export const sendRescueInvoice = async (id: number) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "INVOICE_SENT");
    return { message: "Invoice sent" };
  }
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
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "TOWING_DISPATCHED");
    return { message: "Towing dispatched" };
  }
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/dispatch-towing`,
    payload,
  );
  return data;
};

// Customer: Accept towing → TOWING_ACCEPTED
export const acceptTowing = async (id: number) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "TOWING_ACCEPTED");
    return { message: "Towing accepted" };
  }
  const { data } = await AxiosClient.patch(`/api/rescue-requests/${id}/accept-towing`);
  return data;
};

// SA: Complete towing (car arrived at garage) → TOWED
export const completeTowing = async (
  id: number,
  payload: IRescueCompleteTowingPayload,
) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "TOWED");
    return { message: "Towing completed" };
  }
  const { data } = await AxiosClient.patch(
    `/api/rescue-requests/${id}/complete-towing`,
    payload,
  );
  return data;
};

// Customer: Make payment → COMPLETED
export const makeRescuePayment = async (
  id: number,
  payload: IRescuePaymentPayload,
) => {
  if (USE_MOCK) {
    await _delay();
    _setStatus(id, "COMPLETED");
    return { message: "Payment successful" };
  }
  const { data } = await AxiosClient.post(
    `/api/rescue-requests/${id}/invoice/payment`,
    payload,
  );
  return data;
};
