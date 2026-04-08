import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { createGlobalStyle } from "styled-components";
import { HiSearch } from "react-icons/hi";
import { Button, ConfigProvider, Modal, Table, Tag, Select as AntSelect } from "antd";
import type { TableColumnsType } from "antd";
import {
  inventoryService,
  type ITransferOrder,
} from "@/services/admin/inventoryService";
import { toast } from "react-toastify";

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PAGE_SIZE = 20;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "blue",
  REJECTED: "red",
  COMPLETED: "green",
  CANCELLED: "volcano",
};

const MAINTENANCE_STATUS_COLOR: Record<string, string> = {
  PENDING: "default",
  IN_DIAGNOSIS: "volcano",
  QUOTED: "gold",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

const OrderAssignedManager = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ITransferOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [issuingId, setIssuingId] = useState<number | null>(null);
  const [issueModalRecord, setIssueModalRecord] = useState<ITransferOrder | null>(null);

  const handleIssue = async () => {
    if (!issueModalRecord) return;
    try {
      setIssuingId(issueModalRecord.transferOrderID);
      await inventoryService.issueTransferOrder(issueModalRecord.transferOrderID);
      toast.success(t("orderAssignedIssueSuccess"));
      setIssueModalRecord(null);
      fetchOrders();
    } catch {
      toast.error(t("orderAssignedIssueError"));
    } finally {
      setIssuingId(null);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getMyTransferOrders();
      setItems(res.data ?? []);
    } catch {
      toast.error(t("orderAssignedLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCurrentPage(1);
    }, 400);
  };

  const handleStatusChange = (value: unknown) => {
    setStatusFilter(typeof value === "string" ? value : undefined);
    setCurrentPage(1);
  };

  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      item.carLicensePlate.toLowerCase().includes(term) ||
      item.carBrand.toLowerCase().includes(term) ||
      item.carModel.toLowerCase().includes(term) ||
      (item.note ?? "").toLowerCase().includes(term);
    const matchStatus = !statusFilter || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filteredItems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const columns: TableColumnsType<ITransferOrder> = [
    {
      title: t("orderAssignedColNo"),
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: ITransferOrder, index: number) =>
        (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: t("orderAssignedColTransferID"),
      dataIndex: "transferOrderID",
      key: "transferOrderID",
      width: 100,
      align: "center",
    },
    {
      title: t("orderAssignedColMaintenanceID"),
      dataIndex: "maintenanceID",
      key: "maintenanceID",
      width: 110,
      align: "center",
    },
    {
      title: t("orderAssignedColCar"),
      key: "car",
      width: 220,
      render: (_: unknown, record: ITransferOrder) => (
        <div>
          <CarName>
            {record.carBrand} {record.carModel}
          </CarName>
          <CarPlate>{record.carLicensePlate}</CarPlate>
        </div>
      ),
    },
    {
      title: t("orderAssignedColMaintenanceStatus"),
      key: "maintenanceStatus",
      width: 160,
      render: (_: unknown, record: ITransferOrder) => (
        <Tag color={MAINTENANCE_STATUS_COLOR[record.maintenanceStatus] ?? "default"}>
          {t(`orderAssignedMaintenanceStatus_${record.maintenanceStatus}`) ||
            record.maintenanceStatus}
        </Tag>
      ),
    },
    {
      title: t("orderAssignedColStatus"),
      key: "status",
      width: 130,
      render: (_: unknown, record: ITransferOrder) => (
        <Tag color={STATUS_COLOR[record.status] ?? "default"}>
          {t(`orderAssignedStatus_${record.status}`) || record.status}
        </Tag>
      ),
    },
    {
      title: t("orderAssignedColItemCount"),
      dataIndex: "itemCount",
      key: "itemCount",
      width: 90,
      align: "center",
    },
    {
      title: t("orderAssignedColDocumentDate"),
      key: "documentDate",
      width: 160,
      render: (_: unknown, record: ITransferOrder) =>
        formatDate(record.documentDate),
    },
    {
      title: t("orderAssignedColNote"),
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      render: (note: string) => <NoteText>{note || "—"}</NoteText>,
    },
    {
      title: t("orderAssignedColAction"),
      key: "action",
      width: 120,
      align: "center",
      render: (_: unknown, record: ITransferOrder) => {
        if (record.status === "APPROVED") {
          return (
            <Tag color="blue">{t("orderAssignedIssued")}</Tag>
          );
        }
        if (record.status === "DRAFT") {
          return (
            <Button
              type="primary"
              size="small"
              loading={issuingId === record.transferOrderID}
              onClick={() => setIssueModalRecord(record)}
            >
              {t("orderAssignedIssueBtn")}
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <Container>
      <FilterSelectGlobalStyle />
      <Header>
        <Title>{t("orderAssignedTitle")}</Title>
        <Subtitle>{t("orderAssignedSubtitle")}</Subtitle>
      </Header>

      <Toolbar>
        <SearchWrapper>
          <HiSearch size={16} color="#9ca3af" />
          <SearchInput
            placeholder={t("orderAssignedSearchPlaceholder")}
            value={searchTerm}
            onChange={handleSearchChange}
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
            className="order-assigned-filter-select"
            popupClassName="order-assigned-filter-dropdown"
            allowClear
            placeholder={t("orderAssignedStatusFilter")}
            style={{ minWidth: 190 }}
            value={statusFilter}
            onChange={handleStatusChange}
            options={[
              {
                value: "DRAFT",
                label: <span style={{ color: "#000" }}>{t("orderAssignedStatus_DRAFT")}</span>,
              },
              {
                value: "APPROVED",
                label: <span style={{ color: "#000" }}>{t("orderAssignedStatus_APPROVED")}</span>,
              },
              {
                value: "REJECTED",
                label: <span style={{ color: "#000" }}>{t("orderAssignedStatus_REJECTED")}</span>,
              },
              {
                value: "COMPLETED",
                label: <span style={{ color: "#000" }}>{t("orderAssignedStatus_COMPLETED")}</span>,
              },
              {
                value: "CANCELLED",
                label: <span style={{ color: "#000" }}>{t("orderAssignedStatus_CANCELLED")}</span>,
              },
            ]}
          />
        </ConfigProvider>
      </Toolbar>

      <TableCard>
        <Table<ITransferOrder>
          rowKey="transferOrderID"
          columns={columns}
          dataSource={paginated}
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: filteredItems.length,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("orderAssignedUnit")}`,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </TableCard>

      <Modal
        open={!!issueModalRecord}
        title={t("orderAssignedIssueConfirmTitle")}
        onOk={handleIssue}
        onCancel={() => setIssueModalRecord(null)}
        okText={t("orderAssignedIssueBtn")}
        cancelText={t("no")}
        confirmLoading={issuingId !== null}
        centered
      >
        <p>{t("orderAssignedIssueConfirmDesc")}</p>
        {issueModalRecord && (
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            #{issueModalRecord.transferOrderID} — {issueModalRecord.carBrand} {issueModalRecord.carModel} ({issueModalRecord.carLicensePlate})
          </p>
        )}
      </Modal>
    </Container>
  );
};

export default OrderAssignedManager;

// ─── Styled Components ───────────────────────────────────────────────────────

const Container = styled.div`
  padding: 24px;
  background: #f9fafb;
  min-height: 100%;
`;

const Header = styled.div`
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

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;

  .order-assigned-filter-select .ant-select-selector,
  .order-assigned-filter-select .ant-select-selector .ant-select-selection-item,
  .order-assigned-filter-select .ant-select-selector .ant-select-selection-placeholder,
  .order-assigned-filter-select .ant-select-arrow,
  .order-assigned-filter-select .ant-select-clear {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }
`;

const FilterSelectGlobalStyle = createGlobalStyle`
  .order-assigned-filter-dropdown .ant-select-item,
  .order-assigned-filter-dropdown .ant-select-item-option-content,
  .order-assigned-filter-dropdown .ant-select-item-option-selected .ant-select-item-option-content,
  .order-assigned-filter-dropdown .ant-select-item-option-active .ant-select-item-option-content,
  .order-assigned-filter-dropdown .ant-empty-description {
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

const CarName = styled.div`
  font-weight: 600;
  color: #111827;
  font-size: 13px;
`;

const CarPlate = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
`;

const NoteText = styled.div`
  color: #6b7280;
  font-size: 13px;
`;
