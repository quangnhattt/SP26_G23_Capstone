import AxiosClient from "@/apis/AxiosClient";

export interface ICategory {
  categoryID: number;
  name: string;
  type: string;
  description: string | null;
}

export interface ICategoryRequest {
  name: string;
  type: string;
  description?: string;
}

export type ICategoriesResponse = ICategory[];

export const getCategories = async (params?: { type?: string }): Promise<ICategoriesResponse> => {
  const { data } = await AxiosClient.get<ICategoriesResponse>("/api/categories", { params });
  return data;
};

export const createCategory = async (
  category: ICategoryRequest
): Promise<ICategory> => {
  const { data } = await AxiosClient.post<ICategory>(
    "/api/categories",
    category
  );
  return data;
};

export const updateCategory = async (
  id: number,
  category: ICategoryRequest
): Promise<ICategory> => {
  const { data } = await AxiosClient.put<ICategory>(
    `/api/categories/${id}`,
    category
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
