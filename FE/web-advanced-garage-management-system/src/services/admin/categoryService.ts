import AxiosClient from "@/apis/AxiosClient";

export interface ICategory {
  categoryID: number;
  name: string;
  type: string;
  description: string | null;
  markupPercent: number;
  isActive: boolean;
}

export interface ICategoryRequest {
  name: string;
  type: string;
  description?: string;
  markupPercent?: number;
  isActive?: boolean;
}

export interface ICategoriesResponse {
  items: ICategory[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getCategories = async (params?: {
  type?: string;
}): Promise<ICategory[]> => {
  const { data } = await AxiosClient.get<ICategoriesResponse>(
    "/api/categories",
    { params },
  );
  return data.items;
};

export const createCategory = async (
  category: ICategoryRequest,
): Promise<ICategory> => {
  const { data } = await AxiosClient.post<ICategory>(
    "/api/categories",
    category,
  );
  return data;
};

export const updateCategory = async (
  id: number,
  category: ICategoryRequest,
): Promise<ICategory> => {
  const { data } = await AxiosClient.put<ICategory>(
    `/api/categories/${id}`,
    category,
  );
  return data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await AxiosClient.delete(`/api/categories/${id}`);
};

export const categoryService = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
