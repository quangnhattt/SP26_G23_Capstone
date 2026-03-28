import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiPlus, HiClipboardCheck } from "react-icons/hi";
import { toast } from "react-toastify";
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
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

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

// ─── Component ───────────────────────────────────────────────────────────────

const InventoryManager = () => {
  const { t } = useTranslation();

  const [items, setItems] = useState<IInventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditMessage, setAuditMessage] = useState("");
  const [auditData, setAuditData] = useState<IAuditDiscrepancy[]>([]);
  const [auditing, setAuditing] = useState(false);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => {});
  }, []);

  const fetchTransactions = useCallback(async (page: number, pid?: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryService.getInventoryTransactions({
        PageIndex: page,
        PageSize: PAGE_SIZE,
        ...(pid !== undefined ? { ProductId: pid } : {}),
      });
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
      setTotalCount(res.data.totalCount);
    } catch {
      setError(t("inventoryError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTransactions(currentPage, selectedProductId);
  }, [currentPage, selectedProductId, fetchTransactions]);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedProductId(val === "" ? undefined : Number(val));
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

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <Container>
      <Header>
        <Title>{t("inventoryTitle")}</Title>
        <Subtitle>{t("inventorySubtitle")}</Subtitle>
      </Header>

      {error && <ErrorBox>{error}</ErrorBox>}

      <Toolbar>
        <SelectWrapper>
          <Select value={selectedProductId ?? ""} onChange={handleProductChange}>
            <option value="">{t("inventorySelectProduct")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name}
              </option>
            ))}
          </Select>
        </SelectWrapper>
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
        <TableWrapper>
          <Table>
            <Thead>
              <tr>
                <Th>STT</Th>
                <Th>{t("inventoryProductCode")}</Th>
                <Th>{t("inventoryProductName")}</Th>
                <Th>{t("inventoryTransactionType")}</Th>
                <ThRight>{t("inventoryQuantity")}</ThRight>
                <ThRight>{t("inventoryBalance")}</ThRight>
                <ThRight>{t("inventoryUnitCost")}</ThRight>
                <Th>{t("inventoryTransactionDate")}</Th>
                <Th>{t("inventoryNote")}</Th>
              </tr>
            </Thead>
            <tbody>
              {loading ? (
                <EmptyRow>
                  <EmptyCell colSpan={9}>{t("inventoryLoading")}</EmptyCell>
                </EmptyRow>
              ) : items.length === 0 ? (
                <EmptyRow>
                  <EmptyCell colSpan={9}>{t("inventoryNoData")}</EmptyCell>
                </EmptyRow>
              ) : (
                items.map((item, index) => (
                  <Tr key={item.transactionID}>
                    <TdMuted>{(currentPage - 1) * PAGE_SIZE + index + 1}</TdMuted>
                    <Td>{item.productCode}</Td>
                    <Td>{item.productName}</Td>
                    <Td>
                      <Badge $type={item.transactionType}>{item.transactionType}</Badge>
                    </Td>
                    <TdRight>{item.quantity.toLocaleString("vi-VN")}</TdRight>
                    <TdRight>{item.balance.toLocaleString("vi-VN")}</TdRight>
                    <TdRight>{formatCurrency(item.unitCost)}</TdRight>
                    <Td>{formatDate(item.transactionDate)}</Td>
                    <TdMuted>{item.note || "—"}</TdMuted>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </TableWrapper>

        <PaginationBar>
          <span>
            {t("inventoryTotalInfo", {
              count: totalCount,
              current: currentPage,
              total: totalPages,
            })}
          </span>
          <PageButtons>
            <PageBtn disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
              {t("inventoryPrev")}
            </PageBtn>
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} style={{ padding: "6px 4px" }}>...</span>
              ) : (
                <PageBtn key={p} $active={p === currentPage} onClick={() => setCurrentPage(p as number)}>
                  {p}
                </PageBtn>
              )
            )}
            <PageBtn disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              {t("inventoryNext")}
            </PageBtn>
          </PageButtons>
        </PaginationBar>
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

const SelectWrapper = styled.div`
  min-width: 280px;
  max-width: 420px;
  flex: 1;
`;

const Select = styled.select`
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
  color: #374151;
  outline: none;
  cursor: pointer;
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
  &:hover:not(:disabled) { background: #fffbeb; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
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
  &:hover { background: #2563eb; }
`;

const TableCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Thead = styled.thead`
  background: #f3f4f6;
`;

const Th = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  border-bottom: 1px solid #e5e7eb;
`;

const ThRight = styled(Th)`
  text-align: right;
`;

const Tr = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }
  &:hover {
    background: #f9fafb;
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  color: #374151;
  vertical-align: middle;
  white-space: nowrap;
`;

const TdRight = styled(Td)`
  text-align: right;
`;

const TdMuted = styled(Td)`
  color: #9ca3af;
  font-size: 13px;
`;

const Badge = styled.span<{ $type: string }>`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $type }) =>
    $type === "ISSUE" ? "#fef3c7" : $type === "RECEIPT" ? "#d1fae5" : "#e0e7ff"};
  color: ${({ $type }) =>
    $type === "ISSUE" ? "#92400e" : $type === "RECEIPT" ? "#065f46" : "#3730a3"};
`;

const EmptyRow = styled.tr``;

const EmptyCell = styled.td`
  padding: 48px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
`;

const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
  flex-wrap: wrap;
  gap: 8px;
`;

const PageButtons = styled.div`
  display: flex;
  gap: 6px;
`;

const PageBtn = styled.button<{ $active?: boolean }>`
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid ${({ $active }) => ($active ? "#3b82f6" : "#e5e7eb")};
  background: ${({ $active }) => ($active ? "#3b82f6" : "#fff")};
  color: ${({ $active }) => ($active ? "#fff" : "#374151")};
  font-size: 13px;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
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
