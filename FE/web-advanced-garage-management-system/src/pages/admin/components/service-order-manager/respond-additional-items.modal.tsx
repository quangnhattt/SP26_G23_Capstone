import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiX, HiCheck } from "react-icons/hi";
import { Spin } from "antd";
import { serviceOrderService } from "@/services/admin/serviceOrderService";
import { toast } from "react-toastify";

interface Props {
  isOpen: boolean;
  maintenanceId: number | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

type Decision = "approve" | "reject" | "none";

interface ItemRow {
  type: "SERVICE" | "PART";
  itemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  itemStatus: string;
  decision: Decision;
}

const RespondAdditionalItemsModal = ({
  isOpen,
  maintenanceId,
  onClose,
  onSuccess,
}: Props) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || maintenanceId === null) return;
    let cancelled = false;
    setLoading(true);
    serviceOrderService
      .getAdditionalItems(maintenanceId)
      .then((data) => {
        if (!cancelled) {
          const normalized: ItemRow[] = [
            ...(data.services ?? [])
              .filter((s) => s.itemStatus === "PENDING")
              .map((s) => ({
                type: "SERVICE" as const,
                itemId: s.serviceDetailId,
                itemCode: s.itemCode,
                itemName: s.itemName,
                quantity: s.quantity,
                unitPrice: s.unitPrice,
                notes: s.notes,
                itemStatus: s.itemStatus,
                decision: "none" as Decision,
              })),
            ...(data.parts ?? [])
              .filter((p) => p.itemStatus === "PENDING")
              .map((p) => ({
                type: "PART" as const,
                itemId: p.servicePartDetailId,
                itemCode: p.itemCode,
                itemName: p.itemName,
                quantity: p.quantity,
                unitPrice: p.unitPrice,
                notes: p.notes,
                itemStatus: p.itemStatus,
                decision: "none" as Decision,
              })),
          ];
          setRows(normalized);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(t("respondAdditionalLoadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, maintenanceId]);

  const setDecision = (idx: number, decision: Decision) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, decision } : r))
    );

  const setAll = (decision: Decision) =>
    setRows((prev) => prev.map((r) => ({ ...r, decision })));

  const pendingCount = rows.filter((r) => r.decision === "none").length;

  const handleSubmit = async () => {
    if (!maintenanceId) return;
    try {
      setSubmitting(true);
      await serviceOrderService.respondAdditionalItems(maintenanceId, {
        items: rows.map(({ type, itemId, decision }) => ({
          type,
          itemId,
          approved: decision === "approve",
        })),
      });
      toast.success(t("respondAdditionalSuccess"));
      onSuccess?.();
      onClose();
    } catch {
      toast.error(t("respondAdditionalError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderTitle>{t("respondAdditionalTitle")} #{maintenanceId}</HeaderTitle>
          <CloseBtn onClick={onClose}>
            <HiX size={20} />
          </CloseBtn>
        </ModalHeader>

        <Body>
          {loading ? (
            <Center>
              <Spin />
            </Center>
          ) : rows.length === 0 ? (
            <EmptyText>{t("respondAdditionalEmpty")}</EmptyText>
          ) : (
            <>
              <BulkRow>
                <BulkBtn $color="green" onClick={() => setAll("approve")}>
                  <HiCheck size={14} /> {t("respondAdditionalApproveAll")}
                </BulkBtn>
                <BulkBtn $color="red" onClick={() => setAll("reject")}>
                  <HiX size={14} /> {t("respondAdditionalRejectAll")}
                </BulkBtn>
              </BulkRow>

              {rows.map((row, idx) => (
                <ItemCard
                  key={idx}
                  $decided={row.decision !== "none"}
                  $approved={row.decision === "approve"}
                >
                  <ItemInfo>
                    <ItemName>{row.itemName}</ItemName>
                    <ItemMeta>
                      {row.itemCode} ·{" "}
                      {row.type === "SERVICE" ? t("respondAdditionalTypeService") : t("respondAdditionalTypePart")}
                    </ItemMeta>
                    {row.notes && <ItemNote>{row.notes}</ItemNote>}
                    <ItemPrice>
                      {t("respondAdditionalQtyLabel")} {row.quantity} &nbsp;·&nbsp;{" "}
                      {formatCurrency(row.unitPrice)} {t("respondAdditionalUnitLabel")} &nbsp;·&nbsp;{" "}
                      <strong>
                        {formatCurrency(row.quantity * row.unitPrice)}
                      </strong>
                    </ItemPrice>
                  </ItemInfo>
                  <DecisionBtns>
                    <DecisionBtn
                      $active={row.decision === "approve"}
                      $color="green"
                      onClick={() =>
                        setDecision(
                          idx,
                          row.decision === "approve" ? "none" : "approve"
                        )
                      }
                    >
                      <HiCheck size={15} /> {t("respondAdditionalApprove")}
                    </DecisionBtn>
                    <DecisionBtn
                      $active={row.decision === "reject"}
                      $color="red"
                      onClick={() =>
                        setDecision(
                          idx,
                          row.decision === "reject" ? "none" : "reject"
                        )
                      }
                    >
                      <HiX size={15} /> {t("respondAdditionalReject")}
                    </DecisionBtn>
                  </DecisionBtns>
                </ItemCard>
              ))}
            </>
          )}
        </Body>

        <Footer>
          {pendingCount > 0 && (
            <PendingNote>{t("respondAdditionalPendingNote", { count: pendingCount })}</PendingNote>
          )}
          <CancelBtn onClick={onClose}>{t("respondAdditionalCancel")}</CancelBtn>
          {rows.length > 0 && (
            <ConfirmBtn
              onClick={handleSubmit}
              disabled={submitting || pendingCount > 0}
            >
              {submitting ? t("respondAdditionalSubmitting") : t("respondAdditionalConfirm")}
            </ConfirmBtn>
          )}
        </Footer>
      </Box>
    </Overlay>
  );
};

export default RespondAdditionalItemsModal;

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

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8faff;
  border-radius: 14px 14px 0 0;
`;

const HeaderTitle = styled.h2`
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
  &:hover {
    background: rgba(0, 0, 0, 0.06);
  }
`;

const Body = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Center = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
`;

const EmptyText = styled.div`
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 30px 0;
`;

const BulkRow = styled.div`
  display: flex;
  gap: 8px;
`;

const BulkBtn = styled.button<{ $color: "green" | "red" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid
    ${({ $color }) => ($color === "green" ? "#16a34a" : "#dc2626")};
  color: ${({ $color }) => ($color === "green" ? "#16a34a" : "#dc2626")};
  background: ${({ $color }) =>
    $color === "green" ? "#f0fdf4" : "#fef2f2"};
  &:hover {
    opacity: 0.85;
  }
`;

const ItemCard = styled.div<{ $decided: boolean; $approved: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1.5px solid
    ${({ $decided, $approved }) =>
      !$decided ? "#e5e7eb" : $approved ? "#86efac" : "#fca5a5"};
  background: ${({ $decided, $approved }) =>
    !$decided ? "#fff" : $approved ? "#f0fdf4" : "#fef2f2"};
  transition: all 0.15s;
`;

const ItemInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const ItemName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111827;
`;

const ItemMeta = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const ItemNote = styled.div`
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
`;

const ItemPrice = styled.div`
  font-size: 13px;
  color: #374151;
  margin-top: 2px;
`;

const DecisionBtns = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DecisionBtn = styled.button<{ $active: boolean; $color: "green" | "red" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: 1.5px solid
    ${({ $color }) => ($color === "green" ? "#16a34a" : "#dc2626")};
  color: ${({ $active, $color }) =>
    $active ? "#fff" : $color === "green" ? "#16a34a" : "#dc2626"};
  background: ${({ $active, $color }) =>
    $active
      ? $color === "green"
        ? "#16a34a"
        : "#dc2626"
      : "transparent"};
  &:hover {
    opacity: 0.85;
  }
`;

const Footer = styled.div`
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
`;

const PendingNote = styled.span`
  font-size: 13px;
  color: #f59e0b;
  font-weight: 500;
  margin-right: auto;
`;

const CancelBtn = styled.button`
  padding: 8px 20px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #374151;
  &:hover {
    background: #f9fafb;
  }
`;

const ConfirmBtn = styled.button`
  padding: 8px 20px;
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:not(:disabled):hover {
    background: #2563eb;
  }
`;
