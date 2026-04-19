import axiosClient from "../AxiosClient";
import type { CustomerServiceHistoryDto, ServiceOrderPagedResultDto } from "./types";
import type { IInvoice } from "@/services/admin/serviceOrderService"; // Tái sử dụng IInvoice từ dịch vụ admin

export const getCustomerHistory = async (params?: {
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<ServiceOrderPagedResultDto<CustomerServiceHistoryDto>> => {
  const { data } = await axiosClient.get("/api/service-orders/customer-history", {
    params,
  });
  return data;
};

export const getInvoiceDetail = async (id: number): Promise<IInvoice> => {
  const { data } = await axiosClient.get(`/api/service-orders/${id}/invoice`);
  return data;
};
