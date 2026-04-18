import AxiosClient from "@/apis/AxiosClient";

export interface IInventoryTransaction {
  transactionID: number;
  productID: number;
  productCode: string;
  productName: string;
  referenceID: number;
  transactionType: string;
  quantity: number;
  balance: number;
  unitCost: number;
  transactionDate: string;
  note: string;
}

export interface IInventoryTransactionsResponse {
  message: string;
  data: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    items: IInventoryTransaction[];
  };
}

export interface IInventoryTransactionParams {
  ProductId?: number;
  FromDate?: string;
  ToDate?: string;
  TransactionType?: string;
  PageIndex?: number;
  PageSize?: number;
}

export const getInventoryTransactions = async (
  params: IInventoryTransactionParams
): Promise<IInventoryTransactionsResponse> => {
  const { data } = await AxiosClient.get<IInventoryTransactionsResponse>(
    "/api/Inventory/transactions",
    { params }
  );
  return data;
};

export interface IImportItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  note: string;
}

export interface IImportInventoryRequest {
  supplierId: number;
  note: string;
  items: IImportItem[];
}

export interface IAdjustInventoryRequest {
  productId: number;
  actualQuantity: number;
}

export const importInventory = async (
  payload: IImportInventoryRequest
): Promise<void> => {
  await AxiosClient.post("/api/Inventory/import", payload);
};

export const adjustInventory = async (
  payload: IAdjustInventoryRequest
): Promise<void> => {
  await AxiosClient.post("/api/Inventory/adjust", payload);
};

export interface IAuditDiscrepancy {
  productID: number;
  productCode: string;
  snapshotQuantity: number;
  ledgerQuantity: number;
  difference: number;
}

export interface IAuditDiscrepanciesResponse {
  message: string;
  data: IAuditDiscrepancy[];
}

export const getAuditDiscrepancies = async (): Promise<IAuditDiscrepanciesResponse> => {
  const { data } = await AxiosClient.get<IAuditDiscrepanciesResponse>(
    "/api/Inventory/audit-discrepancies"
  );
  return data;
};

export const rebuildInventoryBalances = async (): Promise<void> => {
  await AxiosClient.post("/api/Inventory/rebuild-balances");
};

export interface ITransferOrderDetail {
  orderDetailID: number;
  productID: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalLineValue: number;
  inventoryStatus: string;
  notes: string | null;
}

export interface ITransferOrder {
  transferOrderID: number;
  status: string;
  note: string;
  documentDate: string;
  createdDate: string;
  maintenanceID: number;
  maintenanceStatus: string;
  carLicensePlate: string;
  carModel: string;
  carBrand: string;
  itemCount: number;
  details: ITransferOrderDetail[];
}

export interface IMyTransferOrdersResponse {
  message: string;
  data: ITransferOrder[];
}

export const getMyTransferOrders = async (): Promise<IMyTransferOrdersResponse> => {
  const { data } = await AxiosClient.get<IMyTransferOrdersResponse>(
    "/api/Inventory/my-transfer-orders"
  );
  return data;
};

export interface ITransferOrderHistoryDetail {
  orderDetailID: number;
  productID: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalLineValue: number;
  inventoryStatus: string;
  notes: string | null;
}

export interface ITransferOrderHistoryItem {
  transferOrderID: number;
  type: string;
  status: string;
  note: string | null;
  documentDate: string;
  createdDate: string;
  createByUserId: number;
  createdByName: string;
  approvedByUserId: number | null;
  approvedByName: string | null;
  maintenanceID: number;
  maintenanceStatus: string;
  technicianID: number;
  technicianName: string;
  carLicensePlate: string;
  carModel: string;
  details: ITransferOrderHistoryDetail[];
}

export interface ITransferOrderHistoryParams {
  Type?: string;
  Status?: string;
  MaintenanceId?: number;
  TechnicianId?: number;
  PageIndex?: number;
  PageSize?: number;
}

export interface ITransferOrderHistoryResponse {
  message: string;
  data: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    items: ITransferOrderHistoryItem[];
  };
}

export const getTransferOrderHistory = async (
  params: ITransferOrderHistoryParams
): Promise<ITransferOrderHistoryResponse> => {
  const { data } = await AxiosClient.get<ITransferOrderHistoryResponse>(
    "/api/inventory/transfer-orders",
    { params }
  );
  return data;
};

export interface IReturnOrderDetail {
  orderDetailID: number;
  productID: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalLineValue: number;
  inventoryStatus: string;
  notes: string | null;
}

export interface IReturnOrderItem {
  transferOrderID: number;
  type: string;
  status: string;
  note: string | null;
  documentDate: string;
  createdDate: string;
  createdByUserId: number;
  createdByName: string;
  approvedByUserId: number | null;
  approvedByName: string | null;
  maintenanceID: number;
  maintenanceStatus: string;
  technicianID: number;
  technicianName: string;
  carLicensePlate: string;
  carModel: string;
  details: IReturnOrderDetail[];
}

export interface IReturnOrdersResponse {
  message: string;
  data: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    items: IReturnOrderItem[];
  };
}

export interface IReturnOrdersParams {
  PageIndex?: number;
  PageSize?: number;
}

export const getReturnOrders = async (
  params: IReturnOrdersParams
): Promise<IReturnOrdersResponse> => {
  const { data } = await AxiosClient.get<IReturnOrdersResponse>(
    "/api/Inventory/returns",
    { params }
  );
  return data;
};

export const approveReturnOrder = async (transferOrderId: number): Promise<void> => {
  await AxiosClient.post(`/api/Inventory/returns/${transferOrderId}/approve`);
};

export const createAutoSurplusReturn = async (): Promise<void> => {
  await AxiosClient.post("/api/Inventory/auto-surplus-return");
};

export const issueTransferOrder = async (transferOrderId: number): Promise<void> => {
  await AxiosClient.post(`/api/Inventory/issue/${transferOrderId}`);
};

export const inventoryService = {
  getInventoryTransactions,
  importInventory,
  adjustInventory,
  getAuditDiscrepancies,
  rebuildInventoryBalances,
  getMyTransferOrders,
  getTransferOrderHistory,
  getReturnOrders,
  approveReturnOrder,
  createAutoSurplusReturn,
  issueTransferOrder,
};
