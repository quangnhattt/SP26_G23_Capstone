import AxiosClient from "@/apis/AxiosClient";

export interface IServiceOrder {
  maintenanceId: number;
  customerName: string;
  carInfo: string;
  maintenanceDate: string;
  completedDate: string | null;
  maintenanceType: string;
  status: string;
  technicianName: string;
}

export interface IServiceOrdersResponse {
  items: IServiceOrder[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface IServiceOrderParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  maintenanceType?: string;
}

export const getServiceOrders = async (
  params: IServiceOrderParams
): Promise<IServiceOrdersResponse> => {
  const { data } = await AxiosClient.get<IServiceOrdersResponse>(
    "/api/service-orders",
    { params }
  );
  return data;
};

export interface ILineItem {
  sourceType: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  itemStatus: string;
}

export interface IServiceOrderDetail {
  maintenanceId: number;
  brand: string;
  model: string;
  color: string;
  licensePlate: string;
  engineNumber: string;
  chassisNumber: string;
  odometer: number;
  status: string;
  createdDate: string;
  maintenanceDate: string;
  technicianFullName?: string | null;
  technicianPhone?: string | null;
  technicianEmail?: string | null;
  lineItems: ILineItem[];
}

export const getServiceOrderDetail = async (
  id: number
): Promise<IServiceOrderDetail> => {
  const { data } = await AxiosClient.get<IServiceOrderDetail>(
    `/api/service-orders/${id}`
  );
  return data;
};

// ─── Additional Items ─────────────────────────────────────────────────────────

export interface IAdditionalServiceItem {
  serviceDetailId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  itemStatus: string;
}

export interface IAdditionalPartItem {
  servicePartDetailId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  itemStatus: string;
}

export interface IAdditionalItemsResponse {
  services: IAdditionalServiceItem[];
  parts: IAdditionalPartItem[];
}

/** GET /api/service-orders/{id}/additional-items
 *  Lấy danh sách hàng mục bổ sung (IsAdditional = true) của phiếu */
export const getAdditionalItems = async (
  id: number
): Promise<IAdditionalItemsResponse> => {
  const { data } = await AxiosClient.get<IAdditionalItemsResponse>(
    `/api/service-orders/${id}/additional-items`
  );
  return data;
};

export interface IAddAdditionalItemsPayload {
  services?: { productId: number; quantity: number; notes?: string }[];
  parts?: { productId: number; quantity: number; notes?: string }[];
}

/** POST /api/service-orders/{id}/additional-items
 *  Tech đề xuất dịch vụ/phụ tùng bổ sung (phiếu phải ở trạng thái IN_DIAGNOSIS) */
export const addAdditionalItems = async (
  id: number,
  payload: IAddAdditionalItemsPayload
): Promise<void> => {
  await AxiosClient.post(`/api/service-orders/${id}/additional-items`, payload);
};

// ─── Invoice ──────────────────────────────────────────────────────────────────

export interface IPackageUsage {
  packageId: number;
  packageCode: string;
  packageName: string;
  packagePrice: number;
  packageDiscountAmount: number;
}

export interface IInvoiceLineItem {
  sourceType: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  itemStatus: string;
}

export interface IInvoice {
  maintenanceId: number;
  customer: {
    userCode: string;
    fullName: string;
    email: string;
    phone: string;
    gender: string | null;
    dob: string | null;
    currentRankId: number;
    totalSpending: number;
  };
  brand: string;
  model: string;
  color: string;
  licensePlate: string;
  engineNumber: string;
  chassisNumber: string;
  odometer: number;
  status: string;
  createdDate: string;
  maintenanceDate: string;
  totalAmount: number;
  membershipRankApplied: string | null;
  membershipDiscountPercent: number;
  membershipDiscountAmount: number;
  finalAmount: number;
  packageUsages: IPackageUsage[];
  lineItems: IInvoiceLineItem[];
}

/** POST /api/service-orders/{id}/invoice
 *  Tạo hóa đơn chính xác cho phiếu (cần bấm 1 nút để truyền dữ liệu từ membershiprank) */
export const createInvoice = async (id: number): Promise<IInvoice> => {
  const { data } = await AxiosClient.post<IInvoice>(
    `/api/service-orders/${id}/invoice`
  );
  return data;
};

// ─── Respond to Additional Items ──────────────────────────────────────────────

export interface IRespondAdditionalItemsPayload {
  items: { type: "SERVICE" | "PART"; itemId: number; approved: boolean }[];
}

/** PATCH /api/service-orders/{id}/additional-items/respond
 *  Duyệt/Từ chối hàng mục bổ sung (phiếu phải ở trạng thái QUOTED) */
export const respondAdditionalItems = async (
  id: number,
  payload: IRespondAdditionalItemsPayload
): Promise<void> => {
  await AxiosClient.patch(
    `/api/service-orders/${id}/additional-items/respond`,
    payload
  );
};

export interface IAssignTechnicianPayload {
  technicianId: number;
}

/** PATCH /api/service-orders/{id}/assign-technician
 *  Chọn kỹ thuật viên cho service order ở trạng thái chờ */
export const assignTechnician = async (
  id: number,
  payload: IAssignTechnicianPayload
): Promise<void> => {
  await AxiosClient.patch(`/api/service-orders/${id}/assign-technician`, payload);
};

/** PATCH /api/service-orders/{id}/start-diagnosis
 *  Chuyển trạng thái từ WAITING sang IN_DIAGNOSIS */
export const startDiagnosis = async (id: number): Promise<void> => {
  await AxiosClient.patch(`/api/service-orders/${id}/start-diagnosis`, {});
};

/** POST /api/Inventory/service-orders/{id}/transfer-order
 *  Chuyển báo giá sang phiếu xuất kho */
export const transferOrder = async (id: number): Promise<void> => {
  await AxiosClient.post(`/api/Inventory/service-orders/${id}/transfer-order`);
};

export const serviceOrderService = {
  getServiceOrders,
  getServiceOrderDetail,
  getAdditionalItems,
  addAdditionalItems,
  createInvoice,
  respondAdditionalItems,
  assignTechnician,
  startDiagnosis,
  transferOrder,
};
