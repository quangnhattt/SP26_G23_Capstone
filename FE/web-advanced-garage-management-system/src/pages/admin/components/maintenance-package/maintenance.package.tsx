import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled, { createGlobalStyle } from "styled-components";
import { HiSearch, HiPlus, HiPencil } from "react-icons/hi";
import {
  Table as AntTable,
  Switch,
  Select as AntSelect,
  ConfigProvider,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  getMaintenancePackages,
  getMaintenancePackageWithProducts,
  createMaintenancePackage,
  updateMaintenancePackage,
  updateMaintenancePackageStatus,
  addPackageDetail,
  updatePackageDetail,
} from "@/services/admin/packageService";
import type {
  IMaintenancePackage,
  IPackageProduct,
} from "@/services/admin/packageService";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import useSelectTextColorFix from "@/hooks/useSelectTextColorFix";
import MaintenancePackageModal from "./MaintenancePackageModal";
import type { PackageFormData } from "./MaintenancePackageModal";
import PackageDetailModal from "./PackageDetailModal";
import type { DetailFormData } from "./PackageDetailModal";

const EMPTY_PACKAGE_FORM: PackageFormData = {
  packageCode: "",
  name: "",
  description: "",
  kilometerMilestone: "",
  monthMilestone: "",
  basePrice: "",
  discountPercent: "",
  estimatedDurationHours: "",
  applicableBrands: "",
  image: "",
  displayOrder: "",
  isActive: false,
};

const EMPTY_DETAIL_FORM: DetailFormData = {
  productId: null,
  quantity: 1,
  isRequired: true,
  displayOrder: "",
  notes: "",
};

const MaintenancePackageManager = () => {
  const { t } = useTranslation();

  // Main list
  const [packages, setPackages] = useState<IMaintenancePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingPackageId, setUpdatingPackageId] = useState<number | null>(null);
  const selectFix = useSelectTextColorFix({ key: "pkg-filter" });

  // Package modal
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<IMaintenancePackage | null>(null);
  const [packageFormData, setPackageFormData] =
    useState<PackageFormData>(EMPTY_PACKAGE_FORM);
  const [submittingPackage, setSubmittingPackage] = useState(false);

  // Expanded rows
  const [expandedProducts, setExpandedProducts] = useState<
    Record<number, IPackageProduct[]>
  >({});
  const [loadingProductsFor, setLoadingProductsFor] = useState<
    Record<number, boolean>
  >({});

  // Detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<IPackageProduct | null>(null);
  const [currentPackageId, setCurrentPackageId] = useState<number | null>(null);
  const [detailFormData, setDetailFormData] =
    useState<DetailFormData>(EMPTY_DETAIL_FORM);
  const [submittingDetail, setSubmittingDetail] = useState(false);

  const fetchPackages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMaintenancePackages();
      setPackages(data);
    } catch (err) {
      console.error("Failed to fetch maintenance packages:", err);
      setError(t("cannotLoadMaintenancePackages"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const loadPackageProducts = useCallback(async (packageId: number) => {
    if (loadingProductsFor[packageId]) return;
    setLoadingProductsFor((prev) => ({ ...prev, [packageId]: true }));
    try {
      const data = await getMaintenancePackageWithProducts(packageId);
      setExpandedProducts((prev) => ({
        ...prev,
        [packageId]: data.products || [],
      }));
    } catch (err) {
      console.error("Error loading package products:", err);
      toast.error(getApiErrorMessage(err, t("errorLoadingPackageProducts")));
      setExpandedProducts((prev) => ({ ...prev, [packageId]: [] }));
    } finally {
      setLoadingProductsFor((prev) => ({ ...prev, [packageId]: false }));
    }
  }, [loadingProductsFor, t]);

  // Package modal handlers
  const handleOpenCreateModal = () => {
    setEditingPackage(null);
    setPackageFormData(EMPTY_PACKAGE_FORM);
    setIsPackageModalOpen(true);
  };

  const handleOpenEditModal = (pkg: IMaintenancePackage) => {
    setEditingPackage(pkg);
    setPackageFormData({
      packageCode: pkg.packageCode,
      name: pkg.name,
      description: pkg.description || "",
      kilometerMilestone: pkg.kilometerMilestone ?? "",
      monthMilestone: pkg.monthMilestone ?? "",
      basePrice: pkg.basePrice,
      discountPercent: pkg.discountPercent,
      estimatedDurationHours: pkg.estimatedDurationHours ?? "",
      applicableBrands: pkg.applicableBrands || "",
      image: pkg.image || "",
      displayOrder: pkg.displayOrder,
      isActive: pkg.isActive,
    });
    setIsPackageModalOpen(true);
  };

  const handlePackageInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setPackageFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? value === ""
              ? ""
              : Number(value)
            : value,
    }));
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPackage(true);
    try {
      const payload = {
        packageCode: packageFormData.packageCode,
        name: packageFormData.name,
        description: packageFormData.description || undefined,
        kilometerMilestone:
          packageFormData.kilometerMilestone === ""
            ? null
            : Number(packageFormData.kilometerMilestone),
        monthMilestone:
          packageFormData.monthMilestone === ""
            ? null
            : Number(packageFormData.monthMilestone),
        basePrice: Number(packageFormData.basePrice),
        discountPercent:
          packageFormData.discountPercent === ""
            ? 0
            : Number(packageFormData.discountPercent),
        estimatedDurationHours:
          packageFormData.estimatedDurationHours === ""
            ? null
            : Number(packageFormData.estimatedDurationHours),
        applicableBrands: packageFormData.applicableBrands || undefined,
        image: packageFormData.image || undefined,
        displayOrder:
          packageFormData.displayOrder === ""
            ? 0
            : Number(packageFormData.displayOrder),
        isActive: packageFormData.isActive,
      };
      if (editingPackage) {
        await updateMaintenancePackage(editingPackage.packageID, payload);
      } else {
        await createMaintenancePackage(payload);
      }
      setIsPackageModalOpen(false);
      await fetchPackages();
    } catch (err) {
      console.error("Error saving maintenance package:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingMaintenancePackage")));
    } finally {
      setSubmittingPackage(false);
    }
  };

  const handleToggleStatus = async (packageId: number, isActive: boolean) => {
    setUpdatingPackageId(packageId);
    try {
      await updateMaintenancePackageStatus(packageId, isActive);
      await fetchPackages();
    } catch (err) {
      console.error("Error updating package status:", err);
      toast.error(
        getApiErrorMessage(err, t("errorSavingMaintenancePackage")),
      );
    } finally {
      setUpdatingPackageId(null);
    }
  };

  // Detail modal handlers
  const handleOpenAddDetailModal = (packageId: number) => {
    setCurrentPackageId(packageId);
    setEditingDetail(null);
    setDetailFormData(EMPTY_DETAIL_FORM);
    setIsDetailModalOpen(true);
  };

  const handleOpenEditDetailModal = (
    detail: IPackageProduct,
    packageId: number,
  ) => {
    setCurrentPackageId(packageId);
    setEditingDetail(detail);
    setDetailFormData({
      productId: detail.productID,
      quantity: detail.quantity,
      isRequired: detail.isRequired,
      displayOrder: detail.displayOrder,
      notes: detail.notes || "",
    });
    setIsDetailModalOpen(true);
  };

  const handleDetailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailFormData.productId || !currentPackageId) return;
    setSubmittingDetail(true);
    try {
      const payload = {
        productId: detailFormData.productId,
        quantity: Number(detailFormData.quantity) || 1,
        isRequired: detailFormData.isRequired,
        displayOrder:
          detailFormData.displayOrder === ""
            ? 0
            : Number(detailFormData.displayOrder),
        notes: detailFormData.notes || undefined,
      };
      if (editingDetail) {
        await updatePackageDetail(editingDetail.packageDetailID, payload);
      } else {
        await addPackageDetail(currentPackageId, payload);
      }
      setIsDetailModalOpen(false);
      // Reload products for this package
      setExpandedProducts((prev) => {
        const next = { ...prev };
        delete next[currentPackageId];
        return next;
      });
      await loadPackageProducts(currentPackageId);
    } catch (err) {
      console.error("Error saving package detail:", err);
      toast.error(getApiErrorMessage(err, t("errorSavingPackageDetail")));
    } finally {
      setSubmittingDetail(false);
    }
  };

  // Filtered list
  const filteredPackages = packages.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.packageCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive);
    return matchSearch && matchStatus;
  });

  // Expandable products sub-table columns
  const detailColumns: ColumnsType<IPackageProduct> = [
    {
      title: t("name"),
      dataIndex: "productName",
      key: "productName",
      render: (name: string) => (
        <span style={{ fontWeight: 500, color: "#1a1d2e" }}>{name}</span>
      ),
    },
    {
      title: t("quantity"),
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      width: 90,
    },
    {
      title: t("isRequired"),
      dataIndex: "isRequired",
      key: "isRequired",
      align: "center",
      width: 100,
      render: (val: boolean) =>
        val ? (
          <Tag color="blue">{t("yes")}</Tag>
        ) : (
          <Tag color="default">{t("no")}</Tag>
        ),
    },
    {
      title: t("displayOrder"),
      dataIndex: "displayOrder",
      key: "displayOrder",
      align: "center",
      width: 110,
    },
    {
      title: t("notes"),
      dataIndex: "notes",
      key: "notes",
      render: (val: string | null) => (
        <span style={{ color: "#6b7590" }}>{val || "—"}</span>
      ),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      width: 80,
      render: (_: unknown, record: IPackageProduct) => (
        <EditButton
          onClick={() =>
            handleOpenEditDetailModal(record, record.packageID)
          }
          title="Edit"
        >
          <HiPencil size={16} />
        </EditButton>
      ),
    },
  ];

  // Main table columns
  const columns: ColumnsType<IMaintenancePackage> = [
    {
      title: t("packageCode"),
      dataIndex: "packageCode",
      key: "packageCode",
      render: (code: string) => <CodeText>{code}</CodeText>,
    },
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => <PackageName>{name}</PackageName>,
    },
    {
      title: t("kilometerMilestone"),
      dataIndex: "kilometerMilestone",
      key: "kilometerMilestone",
      align: "center",
      render: (val: number | null) => (
        <span style={{ color: "#1a1d2e" }}>
          {val != null ? `${val.toLocaleString("vi-VN")} km` : "—"}
        </span>
      ),
    },
    {
      title: t("monthMilestone"),
      dataIndex: "monthMilestone",
      key: "monthMilestone",
      align: "center",
      render: (val: number | null) => (
        <span style={{ color: "#1a1d2e" }}>
          {val != null ? `${val} ${t("months")}` : "—"}
        </span>
      ),
    },
    {
      title: t("basePrice"),
      dataIndex: "basePrice",
      key: "basePrice",
      align: "right",
      render: (val: number) => (
        <span style={{ color: "#1a1d2e" }}>
          {val.toLocaleString("vi-VN")} đ
        </span>
      ),
    },
    {
      title: t("discountPercent"),
      dataIndex: "discountPercent",
      key: "discountPercent",
      align: "center",
      render: (val: number) => <DiscountBadge>{val}%</DiscountBadge>,
    },
    {
      title: t("finalPrice"),
      dataIndex: "finalPrice",
      key: "finalPrice",
      align: "right",
      render: (val: number) => (
        <FinalPrice>{val.toLocaleString("vi-VN")} đ</FinalPrice>
      ),
    },
    {
      title: t("isActive"),
      dataIndex: "isActive",
      key: "isActive",
      align: "center",
      render: (val: boolean, record: IMaintenancePackage) => (
        <Switch
          checked={val}
          loading={updatingPackageId === record.packageID}
          onChange={(checked: boolean) =>
            handleToggleStatus(record.packageID, checked)
          }
        />
      ),
    },
    {
      title: t("action"),
      key: "action",
      align: "center",
      render: (_: unknown, record: IMaintenancePackage) => (
        <EditButton onClick={() => handleOpenEditModal(record)} title="Edit">
          <HiPencil size={18} />
        </EditButton>
      ),
    },
  ];

  return (
    <Container>
      <FilterSelectGlobalStyle />
      <Header>
        <div>
          <Title>{t("maintenancePackageManagement")}</Title>
          <Subtitle>{t("maintenancePackageManagementSubtitle")}</Subtitle>
        </div>
        <AddButton onClick={handleOpenCreateModal}>
          <HiPlus size={18} />
          {t("createNewMaintenancePackage")}
        </AddButton>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            placeholder={t("searchByNameCodePackage")}
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchTerm(e.target.value)
            }
          />
        </SearchWrapper>
        <ConfigProvider theme={selectFix.configProviderTheme}>
          <FilterSelect
            className={selectFix.selectClassName}
            popupClassName={selectFix.popupClassName}
            getPopupContainer={selectFix.getPopupContainer}
            value={statusFilter}
            onChange={(val: unknown) => setStatusFilter(val as string)}
            style={{ minWidth: 160 }}
            options={[
              {
                value: "all",
                label: <span style={{ color: "#000" }}>{t("allStatuses")}</span>,
              },
              {
                value: "active",
                label: <span style={{ color: "#000" }}>{t("active")}</span>,
              },
              {
                value: "inactive",
                label: <span style={{ color: "#000" }}>{t("inactive")}</span>,
              },
            ]}
          />
        </ConfigProvider>
      </Toolbar>

      <TableCard>
        <AntTable
          columns={columns}
          dataSource={filteredPackages}
          rowKey="packageID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("maintenancePackage")}`,
          }}
          scroll={{ x: "max-content" }}
          expandable={{
            onExpand: (expanded, record) => {
              if (
                expanded &&
                expandedProducts[record.packageID] === undefined
              ) {
                loadPackageProducts(record.packageID);
              }
            },
            expandedRowRender: (record) => {
              const products = expandedProducts[record.packageID] || [];
              const isLoadingRow =
                loadingProductsFor[record.packageID] || false;
              return (
                <ExpandedRowContainer>
                  <ExpandedRowHeader>
                    <ExpandedTitle>{t("packageProducts")}</ExpandedTitle>
                    <AddDetailButton
                      onClick={() =>
                        handleOpenAddDetailModal(record.packageID)
                      }
                    >
                      <HiPlus size={14} />
                      {t("addPackageDetail")}
                    </AddDetailButton>
                  </ExpandedRowHeader>
                  <AntTable
                    columns={detailColumns}
                    dataSource={products}
                    rowKey="packageDetailID"
                    loading={isLoadingRow}
                    pagination={false}
                    size="small"
                    locale={{ emptyText: t("noProductsInPackage") }}
                  />
                </ExpandedRowContainer>
              );
            },
          }}
        />
      </TableCard>

      <MaintenancePackageModal
        isOpen={isPackageModalOpen}
        editingPackage={editingPackage}
        formData={packageFormData}
        submitting={submittingPackage}
        onClose={() => setIsPackageModalOpen(false)}
        onSubmit={handlePackageSubmit}
        onInputChange={handlePackageInputChange}
      />

      <PackageDetailModal
        isOpen={isDetailModalOpen}
        editingDetail={editingDetail}
        formData={detailFormData}
        submitting={submittingDetail}
        onClose={() => setIsDetailModalOpen(false)}
        onSubmit={handleDetailSubmit}
        onFormDataChange={(patch) =>
          setDetailFormData((prev) => ({ ...prev, ...patch }))
        }
      />
    </Container>
  );
};

export default MaintenancePackageManager;

// ── Styled components ────────────────────────────────────────────────────────

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

  .pkg-filter-select .ant-select-selector,
  .pkg-filter-select .ant-select-selector .ant-select-selection-item,
  .pkg-filter-select .ant-select-arrow {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }
`;

const FilterSelectGlobalStyle = createGlobalStyle`
  .pkg-filter-dropdown .ant-select-item,
  .pkg-filter-dropdown .ant-select-item-option-content {
    color: #000 !important;
  }
`;

const FilterSelect = styled(AntSelect)`
  &&& .ant-select-selector,
  &&& .ant-select-selector .ant-select-selection-item,
  &&& .ant-select-arrow {
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
  .ant-table-expanded-row > td {
    background: #f8faff !important;
    padding: 0 !important;
  }
`;

const PackageName = styled.div`
  font-weight: 600;
  color: #1a1d2e;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CodeText = styled.span`
  background: #f0f9ff;
  color: #0369a1;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: monospace;
`;

const DiscountBadge = styled.span`
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-block;
`;

const FinalPrice = styled.span`
  font-weight: 700;
  color: #059669;
`;

const ExpandedRowContainer = styled.div`
  padding: 16px 24px 20px;
`;

const ExpandedRowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const ExpandedTitle = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  margin: 0;
`;

const AddDetailButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #059669;
  }
`;

const EditButton = styled.button`
  background: transparent;
  border: none;
  padding: 0.4rem;
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
