import { useCallback, useEffect, useState } from "react";
import { Table, Tag, Select, Input, Space, Button } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { SearchOutlined, EyeOutlined, PlusOutlined, EditOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  getIntakeList,
  getIntakeDetail,
  type IIntakeItem,
  type IIntakeDetail,
} from "@/services/admin/intakeService";
import IntakeDetailModal from "./intake.detail.modal";
import IntakeFormModal from "./intake.form.modal";

const statusColor: Record<string, string> = {
  WAITING: "orange",
  IN_PROGRESS: "blue",
  DONE: "green",
  CANCELLED: "red",
};

const typeColor: Record<string, string> = {
  MAINTENANCE: "blue",
  REPAIR: "gold",
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PAGE_SIZE = 20;

// Global style for Select dropdown (renders outside DOM tree)
const dropdownGlobalStyle = `
  .intake-select-dropdown .ant-select-item {
    color: #111827 !important;
  }
  .intake-select-dropdown .ant-select-item-option-content {
    color: #111827 !important;
  }
  .intake-select-dropdown .ant-select-item-option-selected {
    background-color: #eff6ff !important;
  }
`;

if (typeof document !== "undefined") {
  const styleId = "intake-dropdown-style";
  if (!document.getElementById(styleId)) {
    const tag = document.createElement("style");
    tag.id = styleId;
    tag.innerHTML = dropdownGlobalStyle;
    document.head.appendChild(tag);
  }
}

const IntakeManager = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<IIntakeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [maintenanceType, setMaintenanceType] = useState<string | undefined>(
    undefined,
  );
  const [customerName, setCustomerName] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState<IIntakeDetail | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "update">("create");
  const [formIntakeId, setFormIntakeId] = useState<number | undefined>(undefined);
  const [formDetailData, setFormDetailData] = useState<IIntakeDetail | null>(null);

  const handleCreate = () => {
    setFormMode("create");
    setFormIntakeId(undefined);
    setFormDetailData(null);
    setFormOpen(true);
  };

  const handleEdit = async (id: number) => {
    setFormMode("update");
    setFormIntakeId(id);
    setFormDetailData(null);
    setFormOpen(true);
    try {
      const res = await getIntakeDetail(id);
      setFormDetailData(res);
    } catch (err) {
      console.error("Error fetching intake detail for edit:", err);
    }
  };

  const handleViewDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await getIntakeDetail(id);
      setDetailData(res);
    } catch (err) {
      console.error("Error fetching intake detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const statusLabel: Record<string, string> = {
    WAITING: t("intakeStatusWaiting"),
    IN_PROGRESS: t("intakeStatusInProgress"),
    DONE: t("intakeStatusDone"),
    CANCELLED: t("intakeStatusCancelled"),
  };

  const typeLabel: Record<string, string> = {
    MAINTENANCE: t("intakeMaintenance"),
    REPAIR: t("intakeRepair"),
  };

  const columns: ColumnsType<IIntakeItem> = [
    {
      title: t("intakeColStt"),
      dataIndex: "index",
      width: 48,
      align: "center",
      render: (_: unknown, __: IIntakeItem, index: number) =>
        (page - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: t("intakeColCustomer"),
      dataIndex: "customerName",
      key: "customerName",
      width: 160,
    },
    {
      title: t("intakeColCar"),
      dataIndex: "carInfo",
      key: "carInfo",
      width: 180,
    },
    {
      title: t("intakeColTechnician"),
      dataIndex: "technicianName",
      key: "technicianName",
      width: 150,
    },
    {
      title: t("intakeColType"),
      dataIndex: "maintenanceType",
      key: "maintenanceType",
      width: 110,
      render: (type: string) => (
        <Tag color={typeColor[type] ?? "default"}>
          {typeLabel[type] ?? type}
        </Tag>
      ),
    },
    {
      title: t("intakeColStatus"),
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color={statusColor[status] ?? "default"}>
          {statusLabel[status] ?? status}
        </Tag>
      ),
    },
    {
      title: t("intakeColDate"),
      dataIndex: "maintenanceDate",
      key: "maintenanceDate",
      width: 160,
      render: formatDate,
    },
    {
      title: t("intakeColCompletedDate"),
      dataIndex: "completedDate",
      key: "completedDate",
      width: 160,
      render: formatDate,
    },
    {
      title: t("intakeColAction"),
      key: "action",
      width: 120,
      fixed: "right" as const,
      render: (_: unknown, record: IIntakeItem) => (
        <div style={{ display: "flex", gap: 4 }}>
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.maintenanceId)}
            style={{ color: "#1d4ed8", borderColor: "#93c5fd" }}
          />
          <Button
            type="default"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record.maintenanceId)}
            style={{ color: "#d97706", borderColor: "#fcd34d" }}
          />
        </div>
      ),
    },
  ];

  const fetchData = useCallback(
    async (currentPage: number, type?: string, name?: string) => {
      try {
        setLoading(true);
        const res = await getIntakeList({
          page: currentPage,
          pageSize: PAGE_SIZE,
          ...(type ? { maintenanceType: type } : {}),
          ...(name ? { customerName: name } : {}),
        });
        setItems(res.items);
        setTotalCount(res.totalCount);
      } catch (err) {
        console.error("Error fetching intake list:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(page, maintenanceType, customerName);
  }, [page, maintenanceType, customerName, fetchData]);

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setPage(pagination.current ?? 1);
  };

  const handleSearch = () => {
    setPage(1);
    setCustomerName(searchInput);
  };

  const handleTypeChange = (value: string | undefined) => {
    setPage(1);
    setMaintenanceType(value);
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>{t("intakeTitle")}</PageTitle>
        <FilterRow>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            {t("intakeCreateBtn")}
          </Button>
          <Space>
            <Input
              placeholder={t("intakeSearchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={handleSearch}
              suffix={
                <SearchOutlined
                  onClick={handleSearch}
                  style={{ cursor: "pointer", color: "#1d4ed8" }}
                />
              }
              style={{ width: 240 }}
            />
            <Select
              placeholder={t("intakeFilterAll")}
              allowClear
              value={maintenanceType}
              onChange={handleTypeChange}
              style={{ width: 150 }}
              classNames={{ popup: { root: "intake-select-dropdown" } }}
              options={[
                { value: "MAINTENANCE", label: t("intakeMaintenance") },
                { value: "REPAIR", label: t("intakeRepair") },
              ]}
              labelRender={(props) => (
                <span style={{ color: "#000000" }}>{props.label}</span>
              )}
            />
          </Space>
        </FilterRow>
      </PageHeader>

      <Table<IIntakeItem>
        rowKey="maintenanceId"
        columns={columns}
        dataSource={items}
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total: totalCount,
          showSizeChanger: false,
          showTotal: (total) => t("intakeTotal", { total }),
        }}
        onChange={handleTableChange}
      />

      <IntakeDetailModal
        open={detailOpen}
        loading={detailLoading}
        data={detailData}
        onClose={() => setDetailOpen(false)}
      />

      <IntakeFormModal
        open={formOpen}
        mode={formMode}
        intakeId={formIntakeId}
        detailData={formDetailData}
        onClose={() => setFormOpen(false)}
        onSuccess={() => fetchData(page, maintenanceType, customerName)}
      />
    </PageWrapper>
  );
};

export default IntakeManager;

const PageWrapper = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: #111827;

  .ant-table,
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td,
  .ant-pagination,
  .ant-select-selector,
  .ant-input,
  .ant-input input,
  .ant-select-selection-item,
  .ant-select-selection-placeholder,
  .ant-input-affix-wrapper,
  .ant-input-affix-wrapper input,
  .ant-input-affix-wrapper > input.ant-input {
    color: #111827 !important;
    -webkit-text-fill-color: #111827 !important;
  }

  .ant-input-affix-wrapper,
  .ant-select-selector {
    background-color: #ffffff !important;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: #111827;
  margin: 0;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;
