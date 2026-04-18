import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiPlus, HiClipboardCheck, HiAdjustments, HiSparkles } from "react-icons/hi";
import { toast } from "react-toastify";
import { Table, Tag } from "antd";
import type { TableColumnsType } from "antd";
import {
  inventoryService,
  type IInventoryTransaction,
  type IAuditDiscrepancy,
} from "@/services/admin/inventoryService";
import { getProducts, type IProduct } from "@/services/admin/productService";
import ImportModal from "./import.modal";
import AuditModal from "./audit.modal";
import AdjustModal from "./adjust.modal";
import ReturnOrdersModal from "./return-orders.modal";

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

// Global style for Select dropdown (renders outside DOM tree)
const dropdownGlobalStyle = `
  .inventory-select-dropdown .ant-select-item {
    color: #111827 !important;
  }
  .inventory-select-dropdown .ant-select-item-option-content {
    color: #111827 !important;
  }
  .inventory-select-dropdown .ant-select-item-option-selected {
    background-color: #eff6ff !important;
  }
`;

if (typeof document !== "undefined") {
  const styleId = "inventory-dropdown-style";
  if (!document.getElementById(styleId)) {
    const tag = document.createElement("style");
    tag.id = styleId;
    tag.innerHTML = dropdownGlobalStyle;
    document.head.appendChild(tag);
  }
}

const TRANSACTION_TYPE_COLOR: Record<string, string> = {
  ISSUE: "orange",
  GOODS_RECEIPT: "green",
  ADJUSTMENT: "blue",
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [returnOrdersOpen, setReturnOrdersOpen] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");
  const [auditData, setAuditData] = useState<IAuditDiscrepancy[]>([]);
  const [auditing, setAuditing] = useState(false);
  const [creatingReturn, setCreatingReturn] = useState(false);

  useEffect(() => {
    getProducts({ pageSize: 1000 })
      .then((res) => setProducts(res.items))
      .catch(() => {});
  }, []);

  const fetchTransactions = useCallback(
    async (page: number, pid?: number, from?: string, to?: string) => {
      try {
        setLoading(true);
        setError(null);
        const res = await inventoryService.getInventoryTransactions({
          PageIndex: page,
          PageSize: PAGE_SIZE,
          ...(pid !== undefined ? { ProductId: pid } : {}),
          ...(from ? { FromDate: from } : {}),
          ...(to ? { ToDate: to } : {}),
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
    fetchTransactions(currentPage, selectedProductId, fromDate, toDate);
  }, [currentPage, selectedProductId, fromDate, toDate, fetchTransactions]);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedProductId(value === "" ? undefined : Number(value));
    setCurrentPage(1);
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value);
    setCurrentPage(1);
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value);
    setCurrentPage(1);
  };

  const handleAudit = async () => {
    try {
      setAuditing(true);
      const res = await inventoryService.getAuditDiscrepancies();
      setAuditMessage(res.message);
      setAuditData(res.data);
      return res;
    } finally {
      setAuditing(false);
    }
  };

  const openAuditModal = async () => {
    try {
      await handleAudit();
      setAuditOpen(true);
    } catch {
      toast.error(t("inventoryAuditError"));
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const key = `inventoryTransactionType_${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const handleImportSuccess = () => {
    setCurrentPage(1);
    fetchTransactions(1, selectedProductId, fromDate, toDate);
  };

  const handleCloseReturnOrdersModal = () => {
    setReturnOrdersOpen(false);
    handleImportSuccess();
  };

  const handleCreateAutoSurplusReturn = async () => {
    try {
      setCreatingReturn(true);
      await inventoryService.createAutoSurplusReturn();
      toast.success(t("inventoryAutoReturnSuccess"));
      handleImportSuccess();
    } catch {
      toast.error(t("inventoryAutoReturnError"));
    } finally {
      setCreatingReturn(false);
    }
  };

  const columns: TableColumnsType<IInventoryTransaction> = [
    {
      title: t("inventoryIndex"),
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
      title: t("serviceOrderColOrderId"),
      key: "referenceID",
      width: 150,
      render: (_: unknown, record: IInventoryTransaction) => record.referenceID,
    },
    {
      title: t("inventoryTransactionType"),
      key: "transactionType",
      width: 130,
      render: (_: unknown, record: IInventoryTransaction) => {
        return (
          <Tag color={TRANSACTION_TYPE_COLOR[record.transactionType] ?? "default"}>
            {getTransactionTypeLabel(record.transactionType)}
          </Tag>
        );
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
      render: (_: unknown, record: IInventoryTransaction) =>
        record.note || t("inventoryNoNoteValue"),
    },
  ];


  return (
    <Container>
      <Header>
        <Title>{t("inventoryTitle")}</Title>
        <Subtitle>{t("inventorySubtitle")}</Subtitle>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <FilterSelect
          value={selectedProductId !== undefined ? String(selectedProductId) : ""}
          onChange={handleProductChange}
        >
          <option value="">{t("inventorySelectProduct")}</option>
          {products.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.code} — {p.name}
            </option>
          ))}
        </FilterSelect>
        <DateRangeForm>
          <DateRangeLabel>{t("inventoryFromDate")}</DateRangeLabel>
          <DateInput
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            max={toDate || undefined}
          />
          <DateRangeSeparator>~</DateRangeSeparator>
          <DateRangeLabel>{t("inventoryToDate")}</DateRangeLabel>
          <DateInput
            type="date"
            value={toDate}
            onChange={handleToDateChange}
            min={fromDate || undefined}
          />
        </DateRangeForm>
        <AuditBtn onClick={openAuditModal} disabled={auditing}>
          <HiClipboardCheck size={16} />
          {auditing ? t("inventoryAuditChecking") : t("inventoryAuditButton")}
        </AuditBtn>
        <ReturnBtn onClick={() => setReturnOrdersOpen(true)}>
          <HiClipboardCheck size={16} />
          {t("inventoryReturnOrdersButton")}
        </ReturnBtn>
        <AutoReturnBtn
          onClick={() => void handleCreateAutoSurplusReturn()}
          disabled={creatingReturn}
        >
          <HiSparkles size={16} />
          {creatingReturn
            ? t("inventoryAutoReturnCreating")
            : t("inventoryAutoReturnButton")}
        </AutoReturnBtn>
        <AdjustBtn onClick={() => setIsAdjustModalOpen(true)}>
          <HiAdjustments size={16} />
          {t("inventoryAdjustButton")}
        </AdjustBtn>
        <ImportBtn onClick={() => setIsModalOpen(true)}>
          <HiPlus size={16} />
          {t("inventoryImportButton")}
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
              t("inventoryPaginationTotal", {
                from: range[0],
                to: range[1],
                total,
              }),
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

      <AdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onSuccess={handleImportSuccess}
        products={products}
        selectedProductId={selectedProductId}
      />

      <AuditModal
        isOpen={auditOpen}
        onClose={() => setAuditOpen(false)}
        message={auditMessage}
        data={auditData}
        onRebuildSuccess={handleAudit}
      />

      <ReturnOrdersModal
        isOpen={returnOrdersOpen}
        onClose={handleCloseReturnOrdersModal}
        onApproveSuccess={handleImportSuccess}
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

const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #374151;
  background: white;
  min-width: 280px;
  max-width: 420px;
  flex: 1;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #1d4ed8;
  }
`;

const DateRangeForm = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const DateRangeLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

const DateRangeSeparator = styled.span`
  font-size: 14px;
  color: #9ca3af;
`;

const DateInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #374151;
  background: white;
  min-width: 150px;

  &:focus {
    outline: none;
    border-color: #1d4ed8;
  }
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

const AdjustBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #dbeafe;
  }
`;

const ReturnBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #ecfeff;
  color: #0e7490;
  border: 1px solid #a5f3fc;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #cffafe;
  }
`;

const AutoReturnBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  background: #eef2ff;
  color: #4338ca;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: #e0e7ff;
  }

  &:disabled {
    opacity: 0.65;
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
