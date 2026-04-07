import AxiosClient from "@/apis/AxiosClient";

export interface IProduct {
  id: number;
  code: string;
  name: string;
  price: number;
  unit: string | null;
  category: string;
  warranty: number;
  minStockLevel: number;
  stockQty: number;
  description: string;
  image: string | null;
  isActive: boolean;
}

export interface IProductDetail extends IProduct {
  unitId?: number;
  categoryId?: number;
}

export interface IProductRequest {
  name: string;
  price: number;
  unitId: number;
  categoryId: number;
  warranty: number;
  minStockLevel: number;
  description: string;
  image: string;
  isActive: boolean;
}

export interface IProductsResponse {
  items: IProduct[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface IProductsParams {
  name?: string;
  code?: string;
  page?: number;
  pageSize?: number;
}

export const getProducts = async (params?: IProductsParams): Promise<IProductsResponse> => {
  const { data } = await AxiosClient.get<IProductsResponse>(
    "/api/products/parts",
    { params }
  );
  return data;
};

export const getProductById = async (id: number): Promise<IProductDetail> => {
  const { data } = await AxiosClient.get<IProductDetail>(`/api/products/parts/${id}`);
  return data;
};

export const createProduct = async (
  product: Omit<IProductRequest, "code">
): Promise<IProduct> => {
  const { data } = await AxiosClient.post<IProduct>(
    "/api/products/parts",
    product
  );
  return data;
};

export const updateProduct = async (
  id: number,
  product: Omit<IProductRequest, "code">
): Promise<IProduct> => {
  const { data } = await AxiosClient.put<IProduct>(
    `/api/products/parts/${id}`,
    product
  );
  return data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/products/parts/${id}`);
};

export const updateProductStatus = async (
  id: number,
  isActive: boolean
): Promise<void> => {
  await AxiosClient.patch(`/api/products/${id}/status`, { isActive });
};

export const productService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
};
