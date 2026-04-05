import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled, { createGlobalStyle } from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import {
  Table as AntTable,
  Switch,
  Select as AntSelect,
  ConfigProvider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
} from "@/services/admin/categoryService";
import type { ICategory } from "@/services/admin/categoryService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import CategoryModal from "./CategoryModal";

interface CategoryFormData {
  name: string;
  type: string;
  description: string;
  markupPercent: number;
  isActive: boolean;
}

const CategoryPage = () => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(
    null,
  );
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "Service",
    description: "",
    markupPercent: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [updatingCategoryId, setUpdatingCategoryId] = useState<number | null>(
    null,
  );

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(t("cannotLoadCategories"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      type: "Service",
      description: "",
      markupPercent: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: ICategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      markupPercent: category.markupPercent,
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
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
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.categoryID, formData);
      } else {
        await createCategory(formData);
      }
      handleCloseModal();
      await fetchCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingCategory")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleCategoryStatus = async (
    categoryId: number,
    isActive: boolean,
  ) => {
    setUpdatingCategoryId(categoryId);
    try {
      await updateCategoryStatus(categoryId, isActive);
      await fetchCategories();
    } catch (err) {
      console.error("Error updating category status:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingCategory")));
    } finally {
      setUpdatingCategoryId(null);
    }
  };

  const filteredCategories = categories.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "all" || c.type === typeFilter;
    return matchSearch && matchType;
  });

  const columns: ColumnsType<ICategory> = [
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => <CategoryName>{name}</CategoryName>,
    },
    {
      title: t("type"),
      dataIndex: "type",
      key: "type",
      align: "center",
      render: (type: string) => <TypeBadge>{type}</TypeBadge>,
    },
    {
      title: t("description"),
      dataIndex: "description",
      key: "description",
      render: (desc: string | null) => (
        <DescriptionText>{desc || "—"}</DescriptionText>
      ),
    },
    {
      title: t("markupPercent"),
      dataIndex: "markupPercent",
      key: "markupPercent",
      align: "center",
      render: (val: number) => <span style={{ color: "#1a1d2e" }}>{val}%</span>,
    },
    {
      title: t("isActive"),
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (val: boolean, record: ICategory) => (
        <Switch
          checked={val}
          loading={updatingCategoryId === record.categoryID}
          onChange={(checked: boolean) =>
            handleToggleCategoryStatus(record.categoryID, checked)
          }
        />
      ),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      render: (_: unknown, record: ICategory) => (
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
      <FilterSelectGlobalStyle />
      <Header>
        <div>
          <Title>{t("categoriesManagement")}</Title>
          <Subtitle>{t("categoriesManagementSubtitle")}</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewCategory")}
        </AddButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            placeholder={t("searchByNameTypeCategory")}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        </SearchWrapper>
        <ConfigProvider
          theme={{
            token: { colorText: "#000", colorTextPlaceholder: "#000" },
            components: {
              Select: {
                colorText: "#000",
                colorTextPlaceholder: "#000",
                colorBgContainer: "#fff",
                optionSelectedColor: "#000",
                colorTextDisabled: "#000",
                colorTextQuaternary: "#000",
              },
            },
          }}
        >
          <FilterSelect
            className="category-filter-select"
            popupClassName="category-filter-dropdown"
            value={typeFilter}
            onChange={(val: unknown) => setTypeFilter(val as string)}
            style={{ minWidth: 180 }}
            options={[
              {
                value: "all",
                label: (
                  <span style={{ color: "#000" }}>{t("allCategories")}</span>
                ),
              },
              {
                value: "Service",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("categoryTypeService")}
                  </span>
                ),
              },
              {
                value: "Part",
                label: (
                  <span style={{ color: "#000" }}>{t("categoryTypePart")}</span>
                ),
              },
            ]}
          />
        </ConfigProvider>
      </Toolbar>

      <TableCard>
        <AntTable
          columns={columns}
          dataSource={filteredCategories}
          rowKey="categoryID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("category")}`,
          }}
          scroll={{ x: "max-content" }}
        />
      </TableCard>

      <CategoryModal
        isOpen={isModalOpen}
        editingCategory={editingCategory}
        formData={formData}
        submitting={submitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />
    </Container>
  );
};

export default CategoryPage;

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

  .category-filter-select .ant-select-selector,
  .category-filter-select .ant-select-selector .ant-select-selection-item,
  .category-filter-select
    .ant-select-selector
    .ant-select-selection-placeholder,
  .category-filter-select .ant-select-arrow,
  .category-filter-select .ant-select-clear {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }
`;

const FilterSelectGlobalStyle = createGlobalStyle`
  .category-filter-dropdown .ant-select-item,
  .category-filter-dropdown .ant-select-item-option-content,
  .category-filter-dropdown .ant-select-item-option-selected .ant-select-item-option-content,
  .category-filter-dropdown .ant-select-item-option-active .ant-select-item-option-content,
  .category-filter-dropdown .ant-empty-description {
    color: #000 !important;
  }
`;

const FilterSelect = styled(AntSelect)`
  &&& .ant-select-selector,
  &&& .ant-select-selector .ant-select-selection-item,
  &&& .ant-select-selector .ant-select-selection-placeholder,
  &&& .ant-select-arrow,
  &&& .ant-select-clear {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
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
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #111827;
  background: transparent;
  &::placeholder {
    color: #9ca3af;
  }
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

const CategoryName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TypeBadge = styled.span`
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const DescriptionText = styled.div`
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #6b7590;
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
