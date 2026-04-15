import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { createGlobalStyle } from "styled-components";
import { HiPlus, HiPencil, HiSearch } from "react-icons/hi";
import { Table as AntTable, Switch, ConfigProvider, Select as AntSelect } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  type ISupplier,
  type ISupplierCreateRequest,
  type ISupplierUpdateRequest,
  type ISuppliersQuery,
} from "@/services/admin/supplierService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import useSelectTextColorFix from "@/hooks/useSelectTextColorFix";
import SupplierModal from "./SupplierModal";

interface SupplierFormData {
  name: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  isActive: boolean;
}

const PAGE_SIZE = 10;

const SupplierPage = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    isActive: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [pageIndex, setPageIndex] = useState(1);
  const [updatingSupplierId, setUpdatingSupplierId] = useState<number | null>(null);
  const selectFix = useSelectTextColorFix({ key: "supplier-filter" });

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query: ISuppliersQuery = {
        SearchTerm: searchTerm || undefined,
        IsActive: isActiveFilter,
        Page: pageIndex,
        PageSize: PAGE_SIZE,
      };
      const response = await getSuppliers(query);
      setSuppliers(response.items || []);
      setTotalCount(response.totalCount);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
      setError(t("cannotLoadSuppliers"));
    } finally {
      setLoading(false);
    }
  }, [t, searchTerm, isActiveFilter, pageIndex]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPageIndex(1);
  };

  const handleIsActiveChange = (value: string | undefined) => {
    if (value === "true") setIsActiveFilter(true);
    else if (value === "false") setIsActiveFilter(false);
    else setIsActiveFilter(undefined);
    setPageIndex(1);
  };

  const handleOpenCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      isActive: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: ISupplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      address: supplier.address || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      description: supplier.description || "",
      isActive: supplier.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSupplier) {
        const updatePayload: ISupplierUpdateRequest = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          description: formData.description,
          isActive: formData.isActive,
        };
        await updateSupplier(editingSupplier.supplierID, updatePayload);
      } else {
        const createPayload: ISupplierCreateRequest = {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          description: formData.description || undefined,
        };
        await createSupplier(createPayload);
      }
      handleCloseModal();
      await fetchSuppliers();
    } catch (err) {
      console.error("Error saving supplier:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingSupplier")));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSupplierStatus = async (
    supplierId: number,
    isActive: boolean,
  ) => {
    setUpdatingSupplierId(supplierId);
    try {
      await updateSupplierStatus(supplierId, isActive);
      await fetchSuppliers();
    } catch (err) {
      console.error("Error updating supplier status:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingSupplier")));
    } finally {
      setUpdatingSupplierId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const columns: ColumnsType<ISupplier> = [
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => <SupplierName>{name}</SupplierName>,
    },
    {
      title: t("address"),
      dataIndex: "address",
      key: "address",
      render: (val: string) => (
        <TextEllipsis title={val}>{val || t("notAvailable")}</TextEllipsis>
      ),
    },
    {
      title: t("phone"),
      dataIndex: "phone",
      key: "phone",
      align: "center",
      render: (val: string) => val || t("notAvailable"),
    },
    {
      title: t("email"),
      dataIndex: "email",
      key: "email",
      align: "center",
      render: (val: string) => val || t("notAvailable"),
    },
    {
      title: t("description"),
      dataIndex: "description",
      key: "description",
      render: (val: string) => (
        <TextEllipsis title={val}>{val || t("notAvailable")}</TextEllipsis>
      ),
    },
    {
      title: t("status"),
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (isActive: boolean, record: ISupplier) => (
        <Switch
          checked={isActive}
          loading={updatingSupplierId === record.supplierID}
          onChange={(checked: boolean) =>
            handleToggleSupplierStatus(record.supplierID, checked)
          }
        />
      ),
    },
    {
      title: t("createDate"),
      dataIndex: "createdDate",
      key: "createdDate",
      align: "center",
      render: (val: string) => formatDate(val),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      render: (_: unknown, record: ISupplier) => (
        <ActionButtons>
          <EditButton
            onClick={() => handleOpenEditModal(record)}
            title={t("edit")}
          >
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
          <Title>{t("suppliersManagement")}</Title>
          <Subtitle>{t("suppliersManagementSubtitle")}</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewSupplier")}
        </AddButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            type="text"
            placeholder={t("searchByNameEmailSupplier")}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </SearchWrapper>

        <ConfigProvider theme={selectFix.configProviderTheme}>
          <FilterSelect
            className={selectFix.selectClassName}
            popupClassName={selectFix.popupClassName}
            getPopupContainer={selectFix.getPopupContainer}
            allowClear
            placeholder={t("supplierStatusFilterPlaceholder")}
            value={
              isActiveFilter === undefined
                ? undefined
                : isActiveFilter
                ? "true"
                : "false"
            }
            onChange={(v) => handleIsActiveChange(v as string | undefined)}
            style={{ width: 160 }}
            options={[
              {
                value: "true",
                label: <span style={{ color: "#000" }}>{t("active")}</span>,
              },
              {
                value: "false",
                label: <span style={{ color: "#000" }}>{t("inactive")}</span>,
              },
            ]}
          />
        </ConfigProvider>
      </Toolbar>

      <TableCard>
        <AntTable
          columns={columns}
          dataSource={suppliers}
          rowKey="supplierID"
          loading={loading}
          pagination={{
            current: pageIndex,
            pageSize: PAGE_SIZE,
            total: totalCount,
            showSizeChanger: false,
            onChange: (page) => setPageIndex(page),
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("supplier")}`,
          }}
          scroll={{ x: "max-content" }}
        />
      </TableCard>

      <SupplierModal
        isOpen={isModalOpen}
        editingSupplier={editingSupplier}
        formData={formData}
        submitting={submitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
      />
    </Container>
  );
};

export default SupplierPage;

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
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #111827;
  background: transparent;

  &::placeholder {
    color: #9ca3af;
  }
`;

const FilterSelect = styled(AntSelect)`
  &&& .ant-select-selector,
  &&& .ant-select-selector .ant-select-selection-item,
  &&& .ant-select-selector .ant-select-selection-item-content,
  &&& .ant-select-selector .ant-select-selection-placeholder,
  &&& .ant-select-selection-search-input,
  &&& .ant-select-arrow,
  &&& .ant-select-clear,
  &&& .ant-select-selection-item-remove {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }

  &&&.ant-select-disabled .ant-select-selector,
  &&&.ant-select-disabled .ant-select-selector .ant-select-selection-item,
  &&&.ant-select-disabled
    .ant-select-selector
    .ant-select-selection-placeholder {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }
`;

const FilterSelectGlobalStyle = createGlobalStyle`
  .supplier-filter-dropdown .ant-select-item,
  .supplier-filter-dropdown .ant-select-item-option-content,
  .supplier-filter-dropdown .ant-select-item-option-selected .ant-select-item-option-content,
  .supplier-filter-dropdown .ant-select-item-option-active .ant-select-item-option-content,
  .supplier-filter-dropdown .ant-empty-description {
    color: #000 !important;
  }
`;

const SupplierName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TextEllipsis = styled.span`
  max-width: 150px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
