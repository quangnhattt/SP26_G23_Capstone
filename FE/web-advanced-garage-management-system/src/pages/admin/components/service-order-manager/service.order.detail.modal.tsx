import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiX, HiTruck } from "react-icons/hi";
import { Tag } from "antd";
import {
  serviceOrderService,
  type IServiceOrderDetail,
} from "@/services/admin/serviceOrderService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceOrderDetailModalProps {
  isOpen: boolean;
  maintenanceId: number | null;
  onClose: () => void;
}

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

const STATUS_MAP: Record<string, { color: string }> = {
  PENDING: { color: "default" },
  IN_PROGRESS: { color: "blue" },
  COMPLETED: { color: "green" },
  CANCELLED: { color: "red" },
};

const ITEM_STATUS_COLOR: Record<string, string> = {
  APPROVED: "green",
  PENDING: "orange",
  REJECTED: "red",
};

// ─── Component ────────────────────────────────────────────────────────────────

const ServiceOrderDetailModal = ({
  isOpen,
  maintenanceId,
  onClose,
}: ServiceOrderDetailModalProps) => {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<IServiceOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || maintenanceId === null) return;
    let cancelled = false;

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const res =
          await serviceOrderService.getServiceOrderDetail(maintenanceId);
        if (!cancelled) setDetail(res);
      } catch {
        if (!cancelled) setError(t("serviceOrderDetailError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [isOpen, maintenanceId, t]);

  if (!isOpen) return null;

  const statusMeta = detail
    ? (STATUS_MAP[detail.status] ?? { color: "default" })
    : null;

  return (
    <Overlay onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <ModalHeader>
          <HeaderLeft>
            <HiTruck size={20} />
            <ModalTitle>{t("serviceOrderDetailTitle")}</ModalTitle>
            {detail && (
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                #{detail.maintenanceId}
              </span>
            )}
          </HeaderLeft>
          <CloseBtn onClick={onClose}>
            <HiX size={20} />
          </CloseBtn>
        </ModalHeader>

        {/* Body */}
        <Body>
          {loading && (
            <LoadingText>{t("serviceOrderDetailLoading")}</LoadingText>
          )}
          {error && <ErrorBox>{error}</ErrorBox>}

          {!loading && !error && detail && (
            <>
              {/* Status row */}
              <StatusRow>
                <Tag color={statusMeta?.color}>
                  {t(`serviceOrderStatus_${detail.status}`) || detail.status}
                </Tag>
              </StatusRow>

              {/* Vehicle info */}
              <SectionTitle>{t("serviceOrderDetailVehicleInfo")}</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>{t("serviceOrderDetailBrand")}</InfoLabel>
                  <InfoValue>{detail.brand || "—"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t("serviceOrderDetailModel")}</InfoLabel>
                  <InfoValue>{detail.model || "—"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t("serviceOrderDetailColor")}</InfoLabel>
                  <InfoValue>{detail.color || "—"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t("serviceOrderDetailLicensePlate")}</InfoLabel>
                  <InfoValue>{detail.licensePlate || "—"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t("serviceOrderDetailEngine")}</InfoLabel>
                  <InfoValue>{detail.engineNumber || "—"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t("serviceOrderDetailChassis")}</InfoLabel>
                  <InfoValue>{detail.chassisNumber || "—"}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t("serviceOrderDetailOdometer")}</InfoLabel>
                  <InfoValue>
                    {detail.odometer != null
                      ? detail.odometer.toLocaleString("vi-VN") + " km"
                      : "—"}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>{t("serviceOrderDetailCreatedDate")}</InfoLabel>
                  <InfoValue>{formatDate(detail.createdDate)}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>
                    {t("serviceOrderDetailMaintenanceDate")}
                  </InfoLabel>
                  <InfoValue>{formatDate(detail.maintenanceDate)}</InfoValue>
                </InfoItem>
              </InfoGrid>

              {/* Line items */}
              <SectionTitle>{t("serviceOrderDetailLineItems")}</SectionTitle>
              {detail.lineItems && detail.lineItems.length > 0 ? (
                <TableWrapper>
                  <LineTable>
                    <thead>
                      <tr>
                        <Th style={{ width: 40 }}>{t("serviceOrderDetailColNo")}</Th>
                        <Th>{t("serviceOrderDetailItemType")}</Th>
                        <Th>{t("serviceOrderDetailColCode")}</Th>
                        <Th>{t("serviceOrderDetailItemName")}</Th>
                        <Th style={{ textAlign: "right" }}>
                          {t("serviceOrderDetailItemQty")}
                        </Th>
                        <Th style={{ textAlign: "right" }}>
                          {t("serviceOrderDetailItemUnitPrice")}
                        </Th>
                        <Th style={{ textAlign: "right" }}>
                          {t("serviceOrderDetailItemTotal")}
                        </Th>
                        <Th style={{ textAlign: "center" }}>{t("serviceOrderDetailColStatus")}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.lineItems.map((item, idx) => {
                        const total = item.quantity * item.unitPrice;
                        return (
                          <Tr key={idx}>
                            <TdMuted>{idx + 1}</TdMuted>
                            <Td>{item.sourceType || "—"}</Td>
                            <TdMuted style={{ textAlign: "left" }}>
                              {item.itemCode || "—"}
                            </TdMuted>
                            <Td>
                              <div>{item.itemName || "—"}</div>
                              {item.notes && <NoteText>{item.notes}</NoteText>}
                            </Td>
                            <TdRight>{item.quantity}</TdRight>
                            <TdRight>{formatCurrency(item.unitPrice)}</TdRight>
                            <TdRight>{formatCurrency(total)}</TdRight>
                            <TdCenter>
                              <Tag color={ITEM_STATUS_COLOR[item.itemStatus] ?? "default"}>
                                {t(`serviceOrderDetailItemStatus_${item.itemStatus}`) || item.itemStatus}
                              </Tag>
                            </TdCenter>
                          </Tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <TfootTd
                          colSpan={6}
                          style={{ textAlign: "right", fontWeight: 600 }}
                        >
                          {t("serviceOrderDetailTotal")}
                        </TfootTd>
                        <TfootTd
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          {formatCurrency(
                            detail.lineItems.reduce(
                              (sum, i) => sum + i.quantity * i.unitPrice,
                              0,
                            ),
                          )}
                        </TfootTd>
                        <TfootTd />
                      </tr>
                    </tfoot>
                  </LineTable>
                </TableWrapper>
              ) : (
                <EmptyItems>{t("serviceOrderDetailNoItems")}</EmptyItems>
              )}
            </>
          )}
        </Body>

        {/* Footer */}
        <Footer>
          <CloseTextBtn onClick={onClose}>
            {t("serviceOrderDetailClose")}
          </CloseTextBtn>
        </Footer>
      </Box>
    </Overlay>
  );
};

export default ServiceOrderDetailModal;

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
  max-width: 880px;
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
  gap: 16px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 4px 0 0 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const InfoValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #111827;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const LineTable = styled.table`
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

const Tr = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }
  &:hover {
    background: #f9fafb;
  }
`;

const Td = styled.td`
  padding: 10px 14px;
  color: #374151;
`;

const TdMuted = styled(Td)`
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
`;

const TdRight = styled(Td)`
  text-align: right;
  white-space: nowrap;
`;

const EmptyItems = styled.div`
  padding: 24px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
`;

const LoadingText = styled.div`
  padding: 40px 0;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
`;

const ErrorBox = styled.div`
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
`;

const Footer = styled.div`
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
`;

const CloseTextBtn = styled.button`
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

const NoteText = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
`;

const TdCenter = styled(Td)`
  text-align: center;
`;

const TfootTd = styled.td`
  padding: 10px 14px;
  color: #374151;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
`;
