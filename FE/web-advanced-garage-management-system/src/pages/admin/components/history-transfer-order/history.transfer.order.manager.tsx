import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { createGlobalStyle } from "styled-components";
import { ConfigProvider, Table, Tag, Select as AntSelect } from "antd";
import type { TableColumnsType } from "antd";
import {
  inventoryService,
  type ITransferOrderHistoryItem,
  type ITransferOrderHistoryDetail,
} from "@/services/admin/inventoryService";
import { toast } from "react-toastify";

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const formatCurrency = (val: number) =>
  val.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const PAGE_SIZE = 20;

const TYPE_COLOR: Record<string, string> = {
  ISSUE: "orange",
  GOODS_RECEIPT: "cyan",
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "blue",
};

const MAINTENANCE_STATUS_COLOR: Record<string, string> = {
  PENDING: "default",
  IN_DIAGNOSIS: "volcano",
  QUOTED: "gold",
  IN_PROGRESS: "blue",
  COMPLETED: "green",
  CANCELLED: "red",
};

const INVENTORY_STATUS_COLOR: Record<string, string> = {
  RESERVED: "gold",
  ISSUED: "green",
};

// ─── Component ───────────────────────────────────────────────────────────────

const HistoryTransferOrderManager = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ITransferOrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await inventoryService.getTransferOrderHistory({
        Type: typeFilter,
        Status: statusFilter,
        PageIndex: page,
        PageSize: PAGE_SIZE,
      });
      setItems(res.data?.items ?? []);
      setTotalCount(res.data?.totalCount ?? 0);
    } catch {
      toast.error(t("historyTransferOrderLoadError"));
    } finally {
      setLoading(false);
    }
  }, [t, typeFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
    fetchOrders(1);
  }, [fetchOrders]);


  const filteredItems = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      item.carLicensePlate.toLowerCase().includes(term) ||
      item.carModel.toLowerCase().includes(term) ||
      item.technicianName.toLowerCase().includes(term) ||
      item.createdByName.toLowerCase().includes(term) ||
      (item.note ?? "").toLowerCase().includes(term)
    );
  });

  const expandedRowRender = (record: ITransferOrderHistoryItem) => {
    const detailColumns: TableColumnsType<ITransferOrderHistoryDetail> = [
      {
        title: t("historyTransferOrderDetailColCode"),
        dataIndex: "productCode",
        key: "productCode",
        width: 140,
      },
      {
        title: t("historyTransferOrderDetailColProduct"),
        dataIndex: "productName",
        key: "productName",
      },
      {
        title: t("historyTransferOrderDetailColQty"),
        dataIndex: "quantity",
        key: "quantity",
        width: 90,
        align: "center",
      },
      {
        title: t("historyTransferOrderDetailColUnitPrice"),
        dataIndex: "unitPrice",
        key: "unitPrice",
        width: 150,
        align: "right",
        render: (val: number) => formatCurrency(val),
      },
      {
        title: t("historyTransferOrderDetailColTotal"),
        dataIndex: "totalLineValue",
        key: "totalLineValue",
        width: 150,
        align: "right",
        render: (val: number) => formatCurrency(val),
      },
      {
        title: t("historyTransferOrderDetailColInventoryStatus"),
        dataIndex: "inventoryStatus",
        key: "inventoryStatus",
        width: 130,
        align: "center",
        render: (val: string) => (
          <Tag color={INVENTORY_STATUS_COLOR[val] ?? "default"}>
            {t(`historyTransferOrderInventoryStatus_${val}`) || val}
          </Tag>
        ),
      },
      {
        title: t("historyTransferOrderDetailColNotes"),
        dataIndex: "notes",
        key: "notes",
        render: (val: string | null) => val || "—",
      },
    ];

    return (
      <Table<ITransferOrderHistoryDetail>
        rowKey="orderDetailID"
        columns={detailColumns}
        dataSource={record.details}
        pagination={false}
        size="small"
      />
    );
  };

  const columns: TableColumnsType<ITransferOrderHistoryItem> = [
    {
      title: t("historyTransferOrderColNo"),
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: ITransferOrderHistoryItem, index: number) =>
        (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: t("historyTransferOrderColTransferID"),
      dataIndex: "transferOrderID",
      key: "transferOrderID",
      width: 100,
      align: "center",
    },
    {
      title: t("historyTransferOrderColType"),
      key: "type",
      width: 140,
      align: "center",
      render: (_: unknown, record: ITransferOrderHistoryItem) => (
        <Tag color={TYPE_COLOR[record.type] ?? "default"}>
          {t(`historyTransferOrderType_${record.type}`) || record.type}
        </Tag>
      ),
    },
    {
      title: t("historyTransferOrderColStatus"),
      key: "status",
      width: 120,
      align: "center",
      render: (_: unknown, record: ITransferOrderHistoryItem) => (
        <Tag color={STATUS_COLOR[record.status] ?? "default"}>
          {t(`historyTransferOrderStatus_${record.status}`) || record.status}
        </Tag>
      ),
    },
    {
      title: t("historyTransferOrderColTechnician"),
      key: "technician",
      width: 160,
      render: (_: unknown, record: ITransferOrderHistoryItem) => (
        <TechnicianName>{record.technicianName || "—"}</TechnicianName>
      ),
    },
    {
      title: t("historyTransferOrderColCar"),
      key: "car",
      width: 200,
      render: (_: unknown, record: ITransferOrderHistoryItem) => (
        <div>
          <CarName>{record.carModel}</CarName>
          <CarPlate>{record.carLicensePlate}</CarPlate>
        </div>
      ),
    },
    {
      title: t("historyTransferOrderColMaintenanceID"),
      key: "maintenanceID",
      width: 120,
      align: "center",
      render: (_: unknown, record: ITransferOrderHistoryItem) => {
        if (record.maintenanceID == null) return <div style={{ textAlign: "center" }}>-</div>;
        return (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600 }}>#{record.maintenanceID}</div>
            <Tag
              color={MAINTENANCE_STATUS_COLOR[record.maintenanceStatus] ?? "default"}
              style={{ marginTop: 2 }}
            >
              {t(`historyTransferOrderMaintenanceStatus_${record.maintenanceStatus}`) ||
                record.maintenanceStatus}
            </Tag>
          </div>
        );
      },
    },
    {
      title: t("historyTransferOrderColCreatedBy"),
      dataIndex: "createdByName",
      key: "createdByName",
      width: 150,
      render: (name: string) => <CreatedByText>{name || "—"}</CreatedByText>,
    },
    {
      title: t("historyTransferOrderColDocumentDate"),
      key: "documentDate",
      width: 160,
      render: (_: unknown, record: ITransferOrderHistoryItem) =>
        formatDate(record.documentDate),
    },
    {
      title: t("historyTransferOrderColNote"),
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      render: (note: string | null) => <NoteText>{note || "—"}</NoteText>,
    },
  ];

  return (
    <Container>
      <FilterSelectGlobalStyle />
      <Header>
        <Title>{t("historyTransferOrderTitle")}</Title>
        <Subtitle>{t("historyTransferOrderSubtitle")}</Subtitle>
      </Header>

      <Toolbar>
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
            className="history-to-filter-select"
            popupClassName="history-to-filter-dropdown"
            allowClear
            placeholder={t("historyTransferOrderTypeFilter")}
            style={{ minWidth: 180 }}
            value={typeFilter}
            onChange={(val: unknown) =>
              setTypeFilter(typeof val === "string" ? val : undefined)
            }
            options={[
              {
                value: "ISSUE",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("historyTransferOrderType_ISSUE")}
                  </span>
                ),
              },
              {
                value: "GOODS_RECEIPT",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("historyTransferOrderType_GOODS_RECEIPT")}
                  </span>
                ),
              },
            ]}
          />
          <FilterSelect
            className="history-to-filter-select"
            popupClassName="history-to-filter-dropdown"
            allowClear
            placeholder={t("historyTransferOrderStatusFilter")}
            style={{ minWidth: 180 }}
            value={statusFilter}
            onChange={(val: unknown) =>
              setStatusFilter(typeof val === "string" ? val : undefined)
            }
            options={[
              {
                value: "DRAFT",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("historyTransferOrderStatus_DRAFT")}
                  </span>
                ),
              },
              {
                value: "APPROVED",
                label: (
                  <span style={{ color: "#000" }}>
                    {t("historyTransferOrderStatus_APPROVED")}
                  </span>
                ),
              },
            ]}
          />
        </ConfigProvider>
      </Toolbar>

      <TableCard>
        <Table<ITransferOrderHistoryItem>
          rowKey="transferOrderID"
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          scroll={{ x: "max-content" }}
          expandable={{ expandedRowRender }}
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: searchTerm ? filteredItems.length : totalCount,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} ${t("historyTransferOrderUnit")}`,
            onChange: (page) => {
              setCurrentPage(page);
              if (!searchTerm) fetchOrders(page);
            },
          }}
        />
      </TableCard>
    </Container>
  );
};

export default HistoryTransferOrderManager;

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

  .history-to-filter-select .ant-select-selector,
  .history-to-filter-select .ant-select-selector .ant-select-selection-item,
  .history-to-filter-select .ant-select-selector .ant-select-selection-placeholder,
  .history-to-filter-select .ant-select-arrow,
  .history-to-filter-select .ant-select-clear {
    color: #000 !important;
    -webkit-text-fill-color: #000 !important;
    opacity: 1 !important;
  }
`;

const FilterSelectGlobalStyle = createGlobalStyle`
  .history-to-filter-dropdown .ant-select-item,
  .history-to-filter-dropdown .ant-select-item-option-content,
  .history-to-filter-dropdown .ant-select-item-option-selected .ant-select-item-option-content,
  .history-to-filter-dropdown .ant-select-item-option-active .ant-select-item-option-content,
  .history-to-filter-dropdown .ant-empty-description {
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

const TechnicianName = styled.div`
  font-weight: 500;
  color: #111827;
  font-size: 13px;
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

const CreatedByText = styled.div`
  color: #374151;
  font-size: 13px;
`;

const NoteText = styled.div`
  color: #6b7280;
  font-size: 13px;
`;
