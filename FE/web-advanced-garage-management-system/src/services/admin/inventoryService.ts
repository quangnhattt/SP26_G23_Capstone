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

export const importInventory = async (
  payload: IImportInventoryRequest
): Promise<void> => {
  await AxiosClient.post("/api/Inventory/import", payload);
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

export const inventoryService = {
  getInventoryTransactions,
  importInventory,
  getAuditDiscrepancies,
};
