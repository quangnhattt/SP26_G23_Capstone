export interface CustomerServiceHistoryDto {
  maintenanceId: number;
  finishedDate: string | null;
  licensePlate: string;
  maintenanceType: string;
  finalAmount: number;
  status: string;
}

export interface ServiceOrderPagedResultDto<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
