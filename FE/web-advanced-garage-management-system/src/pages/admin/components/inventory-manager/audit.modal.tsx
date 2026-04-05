import { useState } from "react";
import styled from "styled-components";
import { HiX, HiExclamation, HiCheckCircle } from "react-icons/hi";
import { toast } from "react-toastify";
import {
  inventoryService,
  type IAuditDiscrepancy,
} from "@/services/admin/inventoryService";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  data: IAuditDiscrepancy[];
  onRebuildSuccess: () => Promise<unknown>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AuditModal = ({
  isOpen,
  onClose,
  message,
  data,
  onRebuildSuccess,
}: AuditModalProps) => {
  const [rebuilding, setRebuilding] = useState(false);

  if (!isOpen) return null;

  const hasDiscrepancies = data.length > 0;

  const handleRebuildBalances = async () => {
    try {
      setRebuilding(true);
      await inventoryService.rebuildInventoryBalances();
      await onRebuildSuccess();
      toast.success("Đồng bộ số lượng thành công");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể đồng bộ số lượng, vui lòng thử lại"),
      );
    } finally {
      setRebuilding(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <ModalHeader $warning={hasDiscrepancies}>
          <HeaderLeft>
            {hasDiscrepancies ? (
              <HiExclamation size={22} />
            ) : (
              <HiCheckCircle size={22} />
            )}
            <ModalTitle>Kiểm tra sai lệch số lượng</ModalTitle>
          </HeaderLeft>
          <CloseBtn onClick={onClose}><HiX size={20} /></CloseBtn>
        </ModalHeader>

        <Body>
          <MessageBanner $warning={hasDiscrepancies}>
            {message}
          </MessageBanner>

          {hasDiscrepancies ? (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>STT</Th>
                    <Th>Mã sản phẩm</Th>
                    <ThRight>SL Snapshot</ThRight>
                    <ThRight>SL Sổ cái</ThRight>
                    <ThRight>Sai lệch</ThRight>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <Tr key={item.productID}>
                      <TdMuted>{index + 1}</TdMuted>
                      <Td>{item.productCode}</Td>
                      <TdRight>{item.snapshotQuantity.toLocaleString("vi-VN")}</TdRight>
                      <TdRight>{item.ledgerQuantity.toLocaleString("vi-VN")}</TdRight>
                      <TdRight>
                        <DiffBadge $positive={item.difference > 0}>
                          {item.difference > 0 ? "+" : ""}
                          {item.difference.toLocaleString("vi-VN")}
                        </DiffBadge>
                      </TdRight>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          ) : (
            <EmptyState>
              <HiCheckCircle size={48} color="#10b981" />
              <EmptyText>Không phát hiện sai lệch dữ liệu</EmptyText>
            </EmptyState>
          )}
        </Body>

        <Footer>
          <RebuildBtn onClick={handleRebuildBalances} disabled={rebuilding}>
            {rebuilding ? "Đang đồng bộ..." : "Đồng bộ lại"}
          </RebuildBtn>
          <CloseTextBtn onClick={onClose}>Đóng</CloseTextBtn>
        </Footer>
      </Box>
    </Overlay>
  );
};

export default AuditModal;

// ─── Styled Components ────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
`;

const Box = styled.div`
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div<{ $warning: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: ${({ $warning }) => ($warning ? "#fffbeb" : "#f0fdf4")};
  border-radius: 14px 14px 0 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #111827;
`;

const ModalTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #111827;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  &:hover { background: rgba(0,0,0,0.06); }
`;

const Body = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MessageBanner = styled.div<{ $warning: boolean }>`
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: ${({ $warning }) => ($warning ? "#fef3c7" : "#d1fae5")};
  color: ${({ $warning }) => ($warning ? "#92400e" : "#065f46")};
  border: 1px solid ${({ $warning }) => ($warning ? "#fde68a" : "#6ee7b7")};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const Th = styled.th`
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const ThRight = styled(Th)`
  text-align: right;
`;

const Tr = styled.tr`
  &:not(:last-child) { border-bottom: 1px solid #f3f4f6; }
  &:hover { background: #f9fafb; }
`;

const Td = styled.td`
  padding: 10px 14px;
  color: #374151;
  white-space: nowrap;
`;

const TdMuted = styled(Td)`
  color: #9ca3af;
  font-size: 13px;
`;

const TdRight = styled(Td)`
  text-align: right;
`;

const DiffBadge = styled.span<{ $positive: boolean }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: ${({ $positive }) => ($positive ? "#fee2e2" : "#fef3c7")};
  color: ${({ $positive }) => ($positive ? "#991b1b" : "#92400e")};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
`;

const EmptyText = styled.p`
  font-size: 15px;
  color: #6b7280;
  margin: 0;
`;

const Footer = styled.div`
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const RebuildBtn = styled.button`
  padding: 8px 20px;
  border: none;
  background: #2563eb;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #fff;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CloseTextBtn = styled.button`
  padding: 8px 20px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #374151;
  &:hover { background: #f9fafb; }
`;
