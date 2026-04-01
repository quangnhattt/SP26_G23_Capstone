import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiPlus, HiClipboardCheck } from "react-icons/hi";
import { toast } from "react-toastify";
import { Table, Tag, Select as AntSelect } from "antd";
import type { TableColumnsType } from "antd";
import {
  inventoryService,
  type IInventoryTransaction,
  type IAuditDiscrepancy,
} from "@/services/admin/inventoryService";
import { getProducts, type IProduct } from "@/services/admin/productService";
import ImportModal from "./import.modal";
import AuditModal from "./audit.modal";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const formatDate = (iso: string) => {
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

const TRANSACTION_TYPE_MAP: Record<string, { color: string; label: string }> = {
  ISSUE: { color: "orange", label: "Xuất kho" },
  GOODS_RECEIPT: { color: "green", label: "Nhập kho" },
  ADJUSTMENT: { color: "blue", label: "Điều chỉnh" },
};

// ─── Component ───────────────────────────────────────────────────────────────

const InventoryManager = () => {
  const { t } = useTranslation();

  const [items, setItems] = useState<IInventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<
    number | undefined
  >(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");
  const [auditData, setAuditData] = useState<IAuditDiscrepancy[]>([]);
  const [auditing, setAuditing] = useState(false);

  useEffect(() => {
    getProducts({ pageSize: 1000 })
      .then((res) => setProducts(res.items))
      .catch(() => {});
  }, []);

  const fetchTransactions = useCallback(
    async (page: number, pid?: number) => {
      try {
        setLoading(true);
        setError(null);
        const res = await inventoryService.getInventoryTransactions({
          PageIndex: page,
          PageSize: PAGE_SIZE,
          ...(pid !== undefined ? { ProductId: pid } : {}),
        });
        setItems(res.data?.items ?? []);
        setTotalCount(res.data?.totalCount ?? 0);
      } catch {
        setError(t("inventoryError"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    fetchTransactions(currentPage, selectedProductId);
  }, [currentPage, selectedProductId, fetchTransactions]);

  const handleProductChange = (value: string | undefined) => {
    setSelectedProductId(
      value === undefined || value === "" ? undefined : Number(value),
    );
    setCurrentPage(1);
  };

  const handleAudit = async () => {
    try {
      setAuditing(true);
      const res = await inventoryService.getAuditDiscrepancies();
      setAuditMessage(res.message);
      setAuditData(res.data);
      setAuditOpen(true);
    } catch {
      toast.error("Không thể kiểm tra sai lệch, vui lòng thử lại");
    } finally {
      setAuditing(false);
    }
  };

  const handleImportSuccess = () => {
    setCurrentPage(1);
    fetchTransactions(1, selectedProductId);
  };

  const columns: TableColumnsType<IInventoryTransaction> = [
    {
      title: "STT",
      key: "index",
      width: 60,
      align: "center",
      render: (_: unknown, __: IInventoryTransaction, index: number) =>
        (currentPage - 1) * PAGE_SIZE + index + 1,
    },
    {
      title: t("inventoryProductCode"),
      key: "productCode",
      width: 150,
      render: (_: unknown, record: IInventoryTransaction) => record.productCode,
    },
    {
      title: t("inventoryProductName"),
      key: "productName",
      width: 220,
      render: (_: unknown, record: IInventoryTransaction) => record.productName,
    },
    {
      title: t("inventoryTransactionType"),
      key: "transactionType",
      width: 130,
      render: (_: unknown, record: IInventoryTransaction) => {
        const meta = TRANSACTION_TYPE_MAP[record.transactionType] ?? {
          color: "default",
          label: record.transactionType,
        };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: t("inventoryQuantity"),
      key: "quantity",
      align: "right",
      width: 100,
      render: (_: unknown, record: IInventoryTransaction) =>
        record.quantity?.toLocaleString("vi-VN") ?? "0",
    },
    {
      title: t("inventoryBalance"),
      key: "balance",
      align: "right",
      width: 110,
      render: (_: unknown, record: IInventoryTransaction) =>
        record.balance?.toLocaleString("vi-VN") ?? "0",
    },
    {
      title: t("inventoryUnitCost"),
      key: "unitCost",
      align: "right",
      width: 150,
      render: (_: unknown, record: IInventoryTransaction) =>
        formatCurrency(record.unitCost ?? 0),
    },
    {
      title: t("inventoryTransactionDate"),
      key: "transactionDate",
      width: 160,
      render: (_: unknown, record: IInventoryTransaction) =>
        formatDate(record.transactionDate),
    },
    {
      title: t("inventoryNote"),
      key: "note",
      render: (_: unknown, record: IInventoryTransaction) => record.note || "—",
    },
  ];

  const productOptions = [
    { value: "", label: t("inventorySelectProduct") },
    ...products.map((p) => ({
      value: String(p.id),
      label: `${p.code} — ${p.name}`,
    })),
  ];

  return (
    <Container>
      <Header>
        <Title>{t("inventoryTitle")}</Title>
        <Subtitle>{t("inventorySubtitle")}</Subtitle>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <AntSelect
          style={{ minWidth: 280, maxWidth: 420, flex: 1 }}
          allowClear
          placeholder={t("inventorySelectProduct")}
          options={productOptions}
          value={
            selectedProductId !== undefined
              ? String(selectedProductId)
              : undefined
          }
          onChange={handleProductChange}
        />
        <AuditBtn onClick={handleAudit} disabled={auditing}>
          <HiClipboardCheck size={16} />
          {auditing ? "Đang kiểm tra..." : "Kiểm tra sai lệch"}
        </AuditBtn>
        <ImportBtn onClick={() => setIsModalOpen(true)}>
          <HiPlus size={16} />
          Nhập kho
        </ImportBtn>
      </Toolbar>

      <TableCard>
        <Table<IInventoryTransaction>
          rowKey="transactionID"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{
            current: currentPage,
            pageSize: PAGE_SIZE,
            total: totalCount,
            showSizeChanger: false,
            showTotal: (total, range) =>
              `${range[0]}–${range[1]} / ${total} giao dịch`,
            onChange: (page) => setCurrentPage(page),
          }}
        />
      </TableCard>

      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleImportSuccess}
        products={products}
      />

      <AuditModal
        isOpen={auditOpen}
        onClose={() => setAuditOpen(false)}
        message={auditMessage}
        data={auditData}
      />
    </Container>
  );
};

export default InventoryManager;

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
`;

const AuditBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #fff;
  color: #d97706;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: #fffbeb;
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImportBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    background: #2563eb;
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

const ErrorBox = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
  margin-bottom: 16px;
`;
