import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import { HiX } from "react-icons/hi";
import { toast } from "react-toastify";
import {
  inventoryService,
  type IReturnOrderItem,
} from "@/services/admin/inventoryService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApproveSuccess?: () => void;
}

type ReturnOrderRow = IReturnOrderItem & { key: string };
type DetailRow = IReturnOrderItem["details"][number] & { key: string };

const PAGE_SIZE = 20;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const formatDate = (iso: string) => {
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

const ReturnOrdersModal = ({ isOpen, onClose, onApproveSuccess }: Props) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ReturnOrderRow[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getReturnOrders({
        PageIndex: currentPage,
        PageSize: PAGE_SIZE,
      });
      const items: IReturnOrderItem[] = res.data?.items ?? [];
      const draftItems = items.filter(
        (order) => order.status?.toUpperCase() === "DRAFT",
      );
      setRows(
        draftItems.map((order) => ({ ...order, key: String(order.transferOrderID) })),
      );
      setTotalCount(draftItems.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void fetchData();
  }, [isOpen, currentPage]);

  const getTransactionTypeLabel = (type: string) => {
    const key = `inventoryTransactionType_${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const handleApprove = async (transferOrderId: number) => {
    try {
      setApprovingId(transferOrderId);
      await inventoryService.approveReturnOrder(transferOrderId);
      toast.success(t("inventoryReturnApproveSuccess"));
      await fetchData();
      onApproveSuccess?.();
    } catch {
      toast.error(t("inventoryReturnApproveError"));
    } finally {
      setApprovingId(null);
    }
  };

  const detailColumns: TableColumnsType<DetailRow> = useMemo(
    () => [
      {
        title: t("inventoryIndex"),
        key: "index",
        width: 64,
        align: "center",
        render: (_: unknown, __: DetailRow, index: number) => index + 1,
      },
      {
        title: t("inventoryProductCode"),
        dataIndex: "productCode",
        key: "productCode",
        width: 140,
      },
      {
        title: t("inventoryProductName"),
        dataIndex: "productName",
        key: "productName",
        width: 220,
      },
      {
        title: t("inventoryQuantity"),
        dataIndex: "quantity",
        key: "quantity",
        align: "right",
        width: 100,
        render: (value: number) => value?.toLocaleString("vi-VN") ?? "0",
      },
      {
        title: t("inventoryUnitCost"),
        dataIndex: "unitPrice",
        key: "unitPrice",
        align: "right",
        width: 140,
        render: (value: number) => formatCurrency(value ?? 0),
      },
      {
        title: t("inventoryBalance"),
        dataIndex: "inventoryStatus",
        key: "inventoryStatus",
        width: 120,
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        title: t("inventoryNote"),
        dataIndex: "notes",
        key: "notes",
        render: (value: string | null) => value || t("inventoryNoNoteValue"),
      },
    ],
    [t],
  );

  const columns: TableColumnsType<ReturnOrderRow> = useMemo(
    () => [
      {
        title: t("inventoryIndex"),
        key: "index",
        width: 64,
        align: "center",
        render: (_: unknown, __: ReturnOrderRow, index: number) =>
          (currentPage - 1) * PAGE_SIZE + index + 1,
      },
      {
        title: t("inventoryTransactionId"),
        dataIndex: "transferOrderID",
        key: "transferOrderID",
        width: 110,
      },
      {
        title: t("inventoryTransactionType"),
        dataIndex: "type",
        key: "type",
        width: 160,
        render: (value: string) => (
          <Tag color="geekblue">
            {getTransactionTypeLabel(
              value?.toUpperCase() === "RETURN" ? "RETURN_FROM_RESCUE" : value,
            )}
          </Tag>
        ),
      },
      {
        title: t("inventoryStatus"),
        dataIndex: "status",
        key: "status",
        width: 110,
        render: (value: string) => <Tag>{value}</Tag>,
      },
      {
        title: t("inventoryTransactionDate"),
        dataIndex: "documentDate",
        key: "documentDate",
        width: 170,
        render: (value: string) => formatDate(value),
      },
      {
        title: t("inventoryProductName"),
        dataIndex: "carModel",
        key: "carModel",
        width: 190,
        render: (_: unknown, record: ReturnOrderRow) =>
          `${record.carBrand ?? ""} ${record.carModel ?? ""}`.trim() || "-",
      },
      {
        title: t("inventoryProductCode"),
        dataIndex: "carLicensePlate",
        key: "carLicensePlate",
        width: 130,
      },
      {
        title: t("inventoryNote"),
        dataIndex: "note",
        key: "note",
        render: (value: string | null) => value || t("inventoryNoNoteValue"),
      },
      {
        title: t("inventoryAction"),
        key: "action",
        width: 140,
        fixed: "right",
        render: (_: unknown, record: ReturnOrderRow) => (
          <ApproveBtn
            onClick={() => void handleApprove(record.transferOrderID)}
            disabled={
              approvingId === record.transferOrderID ||
              record.status?.toUpperCase() === "APPROVED"
            }
          >
            {record.status?.toUpperCase() === "APPROVED"
              ? t("inventoryReturnApproved")
              : approvingId === record.transferOrderID
                ? t("inventoryReturnApproving")
                : t("inventoryReturnApproveButton")}
          </ApproveBtn>
        ),
      },
    ],
    [approvingId, currentPage, t],
  );

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{t("inventoryReturnOrdersTitle")}</Title>
          <CloseBtn onClick={onClose}>
            <HiX size={18} />
          </CloseBtn>
        </Header>
        <Body>
          <TableWrap>
            <Table<ReturnOrderRow>
              rowKey="key"
              columns={columns}
              dataSource={rows}
              loading={loading}
              scroll={{ x: "max-content" }}
              expandable={{
                rowExpandable: (record) => (record.details?.length ?? 0) > 0,
                expandedRowRender: (record) => {
                  const details: DetailRow[] = (record.details ?? []).map((d) => ({
                    ...d,
                    key: String(d.orderDetailID),
                  }));
                  return (
                    <DetailWrap>
                      <Table<DetailRow>
                        rowKey="key"
                        columns={detailColumns}
                        dataSource={details}
                        pagination={false}
                        size="small"
                        scroll={{ x: "max-content" }}
                      />
                    </DetailWrap>
                  );
                },
              }}
              pagination={{
                current: currentPage,
                pageSize: PAGE_SIZE,
                total: totalCount,
                showSizeChanger: false,
                onChange: (page) => setCurrentPage(page),
              }}
            />
          </TableWrap>
        </Body>
      </Modal>
    </Overlay>
  );
};

export default ReturnOrdersModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  padding: 16px;
`;

const Modal = styled.div`
  width: min(1200px, 100%);
  max-height: 86vh;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const CloseBtn = styled.button`
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Body = styled.div`
  padding: 10px;
  overflow: auto;
`;

const TableWrap = styled.div`
  .ant-table {
    color: #111827;
  }
  .ant-table-thead > tr > th,
  .ant-table-thead > tr > td {
    color: #111827 !important;
    background: #f3f4f6 !important;
  }
  .ant-table-tbody > tr > td {
    color: #111827 !important;
  }
  .ant-table-tbody > tr:hover > td {
    background: #f9fafb !important;
  }
  .ant-pagination {
    color: #111827;
  }
  .ant-pagination-item a,
  .ant-pagination-prev .ant-pagination-item-link,
  .ant-pagination-next .ant-pagination-item-link {
    color: #111827;
  }
`;

const DetailWrap = styled.div`
  padding: 6px 0;

  .ant-table {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  .ant-table-thead > tr > th {
    background: #f8fafc !important;
  }
`;

const ApproveBtn = styled.button`
  border: 1px solid #86efac;
  background: #f0fdf4;
  color: #166534;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #dcfce7;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
