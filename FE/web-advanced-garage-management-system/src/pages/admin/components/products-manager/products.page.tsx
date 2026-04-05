import styled from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import { useEffect, useState, useRef } from "react";
import { Switch, Table as AntTable } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getProducts,
  createProduct,
  updateProduct,
  getProductById,
  updateProductStatus,
} from "@/services/admin/productService";
import type { IProduct } from "@/services/admin/productService";
import { getUnits } from "@/services/admin/unitService";
import type { IUnit } from "@/services/admin/unitService";
import { getCategories } from "@/services/admin/categoryService";
import type { ICategory } from "@/services/admin/categoryService";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import ProductModal from "./ProductModal";

interface ProductFormData {
  code: string;
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

const ProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [loadingModal, setLoadingModal] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    code: "",
    name: "",
    price: 0,
    unitId: 1,
    categoryId: 1,
    warranty: 0,
    minStockLevel: 0,
    description: "",
    image: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [units, setUnits] = useState<IUnit[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [updatingStatusIds, setUpdatingStatusIds] = useState<number[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchProducts(undefined, 1);
    fetchUnits();
    fetchCategories();
  }, []);

  const fetchUnits = async () => {
    try {
      const data = await getUnits({ type: "PART" });
      setUnits(data);
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories({ type: "Service" });
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchProducts = async (search?: string, page = 1) => {
    try {
      setLoading(true);
      const params = {
        ...(search ? { name: search, code: search } : {}),
        page,
        pageSize,
      };
      const res = await getProducts(params);
      setProducts(res.items);
      setTotalCount(res.totalCount);
      setCurrentPage(res.page);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(t("cannotLoadProducts"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProducts(value.trim() || undefined, 1);
    }, 400);
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      code: "",
      name: "",
      price: 0,
      unitId: 0,
      categoryId: 0,
      warranty: 0,
      minStockLevel: 0,
      description: "",
      image: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (product: IProduct) => {
    setEditingProduct(product);
    setIsModalOpen(true);
    setLoadingModal(true);

    try {
      const productDetail = await getProductById(product.id);

      setFormData({
        code: productDetail.code,
        name: productDetail.name,
        price: productDetail.price,
        unitId:
          productDetail.unitId ??
          units.find((u) => u.name === productDetail.unit)?.unitID ??
          0,
        categoryId:
          productDetail.categoryId ??
          categories.find(
            (c) => c.name === productDetail.category && c.type === "Part",
          )?.categoryID ??
          0,
        warranty: productDetail.warranty,
        minStockLevel: productDetail.minStockLevel,
        description: productDetail.description,
        image: productDetail.image || "",
        isActive: productDetail.isActive,
      });
    } catch (error) {
      console.error("Failed to fetch product detail:", error);
      setFormData({
        code: product.code,
        name: product.name,
        price: product.price,
        unitId: units.find((u) => u.name === product.unit)?.unitID ?? 0,
        categoryId:
          categories.find(
            (c) => c.name === product.category && c.type === "Part",
          )?.categoryID ?? 0,
        warranty: product.warranty,
        minStockLevel: product.minStockLevel,
        description: product.description,
        image: product.image || "",
        isActive: product.isActive,
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "unitId" || name === "categoryId"
            ? Number(value)
            : type === "number"
              ? Number(value)
              : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      await fetchProducts(searchTerm.trim() || undefined, currentPage);
      handleCloseModal();
    } catch (err) {
      console.error("Failed to save product:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingProduct")));
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleToggleProductStatus = async (
    record: IProduct,
    nextIsActive: boolean,
  ) => {
    if (updatingStatusIds.includes(record.id)) return;

    setUpdatingStatusIds((prev) => [...prev, record.id]);
    setProducts((prev) =>
      prev.map((item) =>
        item.id === record.id ? { ...item, isActive: nextIsActive } : item,
      ),
    );

    try {
      await updateProductStatus(record.id, nextIsActive);
    } catch (err) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === record.id ? { ...item, isActive: record.isActive } : item,
        ),
      );
      toast.error(getApiErrorMessage(err, t("errorUpdatingProductStatus")));
    } finally {
      setUpdatingStatusIds((prev) => prev.filter((id) => id !== record.id));
    }
  };

  const columns: ColumnsType<IProduct> = [
    {
      title: t("name"),
      key: "name",
      render: (_: unknown, record: IProduct) => (
        <ProductInfo>
          <div>
            <ProductName>{record.name}</ProductName>
            <ProductCode>{record.code}</ProductCode>
          </div>
        </ProductInfo>
      ),
    },
    {
      title: t("price"),
      dataIndex: "price",
      key: "price",
      align: "center",
      render: (val: number) => <PriceText>{formatPrice(val)}</PriceText>,
    },
    {
      title: t("unit"),
      dataIndex: "unit",
      key: "unit",
      align: "center",
      render: (val: string) => <UnitBadge>{val || "N/A"}</UnitBadge>,
    },
    {
      title: t("category"),
      dataIndex: "category",
      key: "category",
      align: "center",
      render: (val: string) => <CategoryBadge>{val || "N/A"}</CategoryBadge>,
    },
    {
      title: t("warranty"),
      dataIndex: "warranty",
      key: "warranty",
      align: "center",
      render: (val: number) => (
        <span style={{ color: "#1a1d2e" }}>
          {val} {t("months")}
        </span>
      ),
    },
    {
      title: t("minStock"),
      dataIndex: "minStockLevel",
      key: "minStockLevel",
      align: "center",
      render: (val: number) => <span style={{ color: "#1a1d2e" }}>{val}</span>,
    },
    {
      title: t("stockQty"),
      key: "stockQty",
      align: "center",
      render: (_: unknown, record: IProduct) => (
        <StockBadge $isLow={record.stockQty < record.minStockLevel}>
          {record.stockQty}
        </StockBadge>
      ),
    },
    {
      title: t("status"),
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (_: boolean, record: IProduct) => (
        <Switch
          checked={record.isActive}
          loading={updatingStatusIds.includes(record.id)}
          onChange={(checked) => handleToggleProductStatus(record, checked)}
        />
      ),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      render: (_: unknown, record: IProduct) => (
        <ActionButtons>
          <EditButton onClick={() => handleOpenEditModal(record)} title="Edit">
            <HiPencil size={18} />
          </EditButton>
        </ActionButtons>
      ),
    },
  ];

  return (
    <Container>
      <Header>
        <div>
          <Title>{t("productsManagement")}</Title>
          <Subtitle>{t("productsManagementSubtitle")}</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewProduct")}
        </AddButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            type="text"
            placeholder={t("searchByNameCode")}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchWrapper>
      </Toolbar>

      <TableCard>
        <AntTable
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalCount,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("product")}`,
            onChange: (page: number) =>
              fetchProducts(searchTerm.trim() || undefined, page),
          }}
          scroll={{ x: "max-content" }}
        />
      </TableCard>

      <ProductModal
        isOpen={isModalOpen}
        editingProduct={editingProduct}
        loadingModal={loadingModal}
        submitting={submitting}
        formData={formData}
        units={units}
        categories={categories}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />
    </Container>
  );
};

export default ProductsPage;

const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const ErrorBox = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  margin-bottom: 16px;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
`;

const TableCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  padding: 0 8px;

  .ant-table {
    color: #374151;
  }
  .ant-table-thead > tr > th,
  .ant-table-thead > tr > td {
    color: #374151 !important;
    background: #f3f4f6 !important;
  }
  .ant-table-tbody > tr > td {
    color: #374151 !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f9fafb !important;
  }
  .ant-pagination {
    color: #374151;
  }
`;

const SearchWrapper = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  flex: 1;
  min-width: 220px;
  max-width: 360px;
  cursor: text;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }
`;

const SearchInput = styled.input`
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #111827;

  &::placeholder {
    color: #9ca3af;
  }
`;

const ProductInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProductName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductCode = styled.div`
  font-size: 0.75rem;
  color: #9ca3bf;
  margin-top: 0.125rem;
`;

const PriceText = styled.div`
  font-weight: 600;
  color: #059669;
`;

const UnitBadge = styled.span`
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const CategoryBadge = styled.span`
  background: #fef3c7;
  color: #b45309;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const StockBadge = styled.span<{ $isLow: boolean }>`
  background: ${(props) => (props.$isLow ? "#fee2e2" : "#dcfce7")};
  color: ${(props) => (props.$isLow ? "#dc2626" : "#16a34a")};
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  color: #3b82f6;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #dbeafe;
    color: #2563eb;
  }
`;
