import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { HiX, HiTruck } from "react-icons/hi";
import { Tag, Table as AntTable } from "antd";
import type { ColumnsType } from "antd/es/table";
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

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

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

              {(detail.technicianFullName ||
                detail.technicianPhone ||
                detail.technicianEmail) && (
                <>
                  <SectionTitle>{t("serviceOrderDetailTechnicianInfo")}</SectionTitle>
                  <InfoGrid>
                    <InfoItem>
                      <InfoLabel>{t("serviceOrderDetailTechnicianName")}</InfoLabel>
                      <InfoValue>{detail.technicianFullName || "—"}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>{t("serviceOrderDetailTechnicianPhone")}</InfoLabel>
                      <InfoValue>{detail.technicianPhone || "—"}</InfoValue>
                    </InfoItem>
                    <InfoItem>
                      <InfoLabel>{t("serviceOrderDetailTechnicianEmail")}</InfoLabel>
                      <InfoValue>{detail.technicianEmail || "—"}</InfoValue>
                    </InfoItem>
                  </InfoGrid>
                </>
              )}

              {/* Line items */}
              <SectionTitle>{t("serviceOrderDetailLineItems")}</SectionTitle>
              {(() => {
                type LineItem = (typeof detail.lineItems)[number];
                const lineItemColumns: ColumnsType<LineItem> = [
                  {
                    title: t("serviceOrderDetailColNo"),
                    key: "no",
                    align: "center",
                    width: 50,
                    render: (_: unknown, __: LineItem, idx: number) => (
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>{idx + 1}</span>
                    ),
                  },
                  {
                    title: t("serviceOrderDetailItemType"),
                    dataIndex: "sourceType",
                    key: "sourceType",
                    render: (val: string) => val || "—",
                  },
                  {
                    title: t("serviceOrderDetailColCode"),
                    dataIndex: "itemCode",
                    key: "itemCode",
                    render: (val: string) => (
                      <span style={{ color: "#9ca3af", fontSize: 13 }}>{val || "—"}</span>
                    ),
                  },
                  {
                    title: t("serviceOrderDetailItemName"),
                    dataIndex: "itemName",
                    key: "itemName",
                    render: (val: string, record: LineItem) => (
                      <div>
                        <div style={{ color: "#374151" }}>{val || "—"}</div>
                        {record.notes && (
                          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                            {record.notes}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: t("serviceOrderDetailItemQty"),
                    dataIndex: "quantity",
                    key: "quantity",
                    align: "right",
                  },
                  {
                    title: t("serviceOrderDetailItemUnitPrice"),
                    dataIndex: "unitPrice",
                    key: "unitPrice",
                    align: "right",
                    render: (val: number) => formatCurrency(val),
                  },
                  {
                    title: t("serviceOrderDetailItemTotal"),
                    key: "total",
                    align: "right",
                    render: (_: unknown, record: LineItem) =>
                      formatCurrency(record.quantity * record.unitPrice),
                  },
                  {
                    title: t("serviceOrderDetailColStatus"),
                    dataIndex: "itemStatus",
                    key: "itemStatus",
                    align: "center",
                    render: (val: string) => (
                      <Tag color={ITEM_STATUS_COLOR[val] ?? "default"}>
                        {t(`serviceOrderDetailItemStatus_${val}`) || val}
                      </Tag>
                    ),
                  },
                ];

                const approvedTotal = detail.lineItems
                  .filter((i) => i.itemStatus === "APPROVED")
                  .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

                const dataWithIndex = detail.lineItems.map((item, idx) => ({
                  ...item,
                  _rowKey: idx,
                }));

                return (
                  <TableCard>
                    <AntTable
                      columns={lineItemColumns}
                      dataSource={dataWithIndex}
                      rowKey="_rowKey"
                      pagination={false}
                      scroll={{ x: "max-content" }}
                      summary={() => (
                        <AntTable.Summary.Row>
                          <AntTable.Summary.Cell index={0} colSpan={6}>
                            <span style={{ fontWeight: 600, color: "#374151", float: "right" }}>
                              {t("serviceOrderDetailTotal")}
                            </span>
                          </AntTable.Summary.Cell>
                          <AntTable.Summary.Cell index={6} align="right">
                            <span style={{ fontWeight: 700, color: "#111827" }}>
                              {formatCurrency(approvedTotal)}
                            </span>
                          </AntTable.Summary.Cell>
                          <AntTable.Summary.Cell index={7} />
                        </AntTable.Summary.Row>
                      )}
                    />
                  </TableCard>
                );
              })()}
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
  padding: 8px;
  overflow: hidden;
`;

const Box = styled.div`
  background: #fff;
  border-radius: 14px;
  width: 100%;
  max-width: 880px;
  height: calc(100dvh - 16px);
  max-height: calc(100dvh - 16px);
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  padding: 14px 16px;
  overflow-y: auto;
  overscroll-behavior: contain;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 2px 0 0 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #f3f4f6;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 20px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const InfoLabel = styled.span`
  font-size: 11px;
  line-height: 1.2;
  color: #9ca3af;
`;

const InfoValue = styled.span`
  font-size: 13px;
  line-height: 1.25;
  font-weight: 500;
  color: #111827;
`;

const TableCard = styled.div`
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow-x: auto;

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
  .ant-table-summary > tr > td {
    background: #f9fafb;
    border-top: 2px solid #e5e7eb;
  }
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

