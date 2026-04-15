import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  FaTimes,
  FaUser,
  FaCar,
  FaMapMarkerAlt,
  FaWrench,
  FaUserCog,
  FaMoneyBillWave,
  FaClipboardCheck,
} from "react-icons/fa";
import type { IRescueRequest, RescueStatus } from "@/apis/rescue";
import { rescueStatusStyle } from "@/pages/appointments/rescueStatusConfig";
import RescueStepProgress from "./RescueStepProgress";

interface RescueDetailModalProps {
  rescue: IRescueRequest | null;
  loading?: boolean;
  onClose: () => void;
}

const getStatusInfo = (status: RescueStatus | string) =>
  rescueStatusStyle[status] || {
    labelKey: status,
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  };

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value?: number | null) => {
  if (value == null) return "—";
  return value.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

const RescueDetailModal = ({ rescue, loading = false, onClose }: RescueDetailModalProps) => {
  const { t } = useTranslation();
  const statusInfo = rescue ? getStatusInfo(rescue.status) : null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {loading
              ? t("loading")
              : rescue
                ? `RESCUE-${rescue.rescueId} — ${rescue.problemDescription}`
                : t("rescueMgrDetailTitle")}
          </ModalTitle>
          <CloseBtn onClick={onClose}>
            <FaTimes />
          </CloseBtn>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <LoadingState>{t("loading")}</LoadingState>
          ) : !rescue ? (
            <EmptyState>{t("rescueMgrEmpty")}</EmptyState>
          ) : (
            <DetailGrid>
              <DetailSection>
                <DetailSectionTitle>
                  <FaUser size={14} /> {t("rescueMgrCustomerInfo")}
                </DetailSectionTitle>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrName")}:</DetailLabel>
                  <DetailValue>{rescue.customerName}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueContactPhone")}:</DetailLabel>
                  <DetailValue>{rescue.customerPhone}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("email")}:</DetailLabel>
                  <DetailValue>{rescue.customerEmail || "—"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrTrustScore")}:</DetailLabel>
                  <DetailValue>{rescue.customerTrustScore ?? "—"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrMembership")}:</DetailLabel>
                  <DetailValue>{rescue.membershipRank || "—"}</DetailValue>
                </DetailRow>
              </DetailSection>

              <DetailSection>
                <DetailSectionTitle>
                  <FaCar size={14} /> {t("rescueVehicleInfo")}
                </DetailSectionTitle>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrCar")}:</DetailLabel>
                  <DetailValue>
                    {rescue.brand} {rescue.model}
                  </DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrPlate")}:</DetailLabel>
                  <DetailValue>{rescue.licensePlate}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("year")}:</DetailLabel>
                  <DetailValue>{rescue.year ?? "—"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("color")}:</DetailLabel>
                  <DetailValue>{rescue.color || "—"}</DetailValue>
                </DetailRow>
              </DetailSection>

              <DetailSection>
                <DetailSectionTitle>
                  <FaMapMarkerAlt size={14} /> {t("rescueAddress")}
                </DetailSectionTitle>
                <DetailRow>
                  <DetailLabel>{t("address")}:</DetailLabel>
                  <DetailValue>{rescue.currentAddress}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrLatitude")}:</DetailLabel>
                  <DetailValue>{rescue.latitude ?? "—"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrLongitude")}:</DetailLabel>
                  <DetailValue>{rescue.longitude ?? "—"}</DetailValue>
                </DetailRow>
              </DetailSection>

              <DetailSection>
                <DetailSectionTitle>
                  <FaWrench size={14} /> {t("rescueIssueSummary")}
                </DetailSectionTitle>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrIssueLabel")}:</DetailLabel>
                  <DetailValue>{rescue.problemDescription}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrRescueType")}:</DetailLabel>
                  <DetailValue>{rescue.rescueType || "—"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrCreatedAt")}:</DetailLabel>
                  <DetailValue>{formatDateTime(rescue.createdDate)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrEta")}:</DetailLabel>
                  <DetailValue>{formatDateTime(rescue.estimatedArrivalDateTime)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrCompletedAt")}:</DetailLabel>
                  <DetailValue>{formatDateTime(rescue.completedDate)}</DetailValue>
                </DetailRow>
              </DetailSection>

              {(rescue.serviceAdvisorName ||
                rescue.assignedTechnicianName ||
                rescue.assignedTechnicianPhone ||
                rescue.resultingMaintenanceId) && (
                <DetailSection>
                  <DetailSectionTitle>
                    <FaUserCog size={14} /> {t("rescueMgrAssign")}
                  </DetailSectionTitle>
                  <DetailRow>
                    <DetailLabel>{t("serviceAdvisor")}:</DetailLabel>
                    <DetailValue>{rescue.serviceAdvisorName || "—"}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>{t("rescueMgrAssignedTechnician")}:</DetailLabel>
                    <DetailValue>{rescue.assignedTechnicianName || "—"}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>{t("rescueMgrAssignedTechnicianPhone")}:</DetailLabel>
                    <DetailValue>{rescue.assignedTechnicianPhone || "—"}</DetailValue>
                  </DetailRow>
                  <DetailRow>
                    <DetailLabel>{t("rescueMgrResultingMaintenanceId")}:</DetailLabel>
                    <DetailValue>{rescue.resultingMaintenanceId ?? "—"}</DetailValue>
                  </DetailRow>
                </DetailSection>
              )}

              <DetailSection>
                <DetailSectionTitle>
                  <FaMoneyBillWave size={14} /> {t("rescueMgrCostInfo")}
                </DetailSectionTitle>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrServiceFee")}:</DetailLabel>
                  <DetailValue>{formatCurrency(rescue.serviceFee)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrDepositRequired")}:</DetailLabel>
                  <DetailValue>{rescue.requiresDeposit ? t("yes") : t("no")}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrDepositAmountInfo")}:</DetailLabel>
                  <DetailValue>{formatCurrency(rescue.depositAmount)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrDepositPaid")}:</DetailLabel>
                  <DetailValue>{rescue.isDepositPaid ? t("yes") : t("no")}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>{t("rescueMgrDepositConfirmed")}:</DetailLabel>
                  <DetailValue>{rescue.isDepositConfirmed ? t("yes") : t("no")}</DetailValue>
                </DetailRow>
              </DetailSection>
              {rescue.suggestedParts && rescue.suggestedParts.length > 0 && (
                <DetailSection>
                  <DetailSectionTitle>
                    <FaClipboardCheck size={14} /> Phụ tùng / dịch vụ đề xuất
                  </DetailSectionTitle>
                  <DetailList>
                    {rescue.suggestedParts.map((item) => (
                      <DetailListItem key={`${item.partId}-${item.partCode ?? item.partName}`}>
                        <ListMain>
                          {item.partName || "—"}
                          {item.partCode ? ` (${item.partCode})` : ""}
                        </ListMain>
                        <ListMeta>
                          {item.partType || "—"} | {t("quantity")}: {item.quantity} | {t("price")}: {formatCurrency(item.unitPrice)} | {t("rescueMgrEstimatedAmount")}: {formatCurrency(item.estimatedLineAmount)}
                        </ListMeta>
                      </DetailListItem>
                    ))}
                  </DetailList>
                </DetailSection>
              )}

              {rescue.repairItems && rescue.repairItems.length > 0 && (
                <DetailSection>
                  <DetailSectionTitle>
                    <FaWrench size={14} /> {t("rescueMgrRepairItems")}
                  </DetailSectionTitle>
                  <DetailList>
                    {rescue.repairItems.map((item) => (
                      <DetailListItem key={`${item.serviceDetailId ?? item.productId}-${item.productId}`}>
                        <ListMain>{item.productName || `#${item.productId}`}</ListMain>
                        <ListMeta>
                          {t("quantity")}: {item.quantity} | {t("price")}: {formatCurrency(item.unitPrice)} | {t("rescueMgrLineTotal")}: {formatCurrency(item.totalPrice ?? item.lineTotal)}
                          {item.notes ? ` | ${t("notes")}: ${item.notes}` : ""}
                        </ListMeta>
                      </DetailListItem>
                    ))}
                  </DetailList>
                </DetailSection>
              )}
            </DetailGrid>
          )}
          {rescue && !loading && (
            <RescueStepProgress status={rescue.status} rescueType={rescue.rescueType} />
          )}
        </ModalBody>
        <ModalFooter>
          {statusInfo && (
            <Badge $color={statusInfo.color} $bg={statusInfo.bg}>
              {t(statusInfo.labelKey)}
            </Badge>
          )}
          <ModalCloseBtn onClick={onClose}>
            {t("rescueMgrClose")}
          </ModalCloseBtn>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default RescueDetailModal;

// ─── Styled Components ───────────────────────────────────────
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  max-width: 860px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;

  &:hover {
    color: #111827;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  align-items: center;
`;

const ModalCloseBtn = styled.button`
  padding: 0.5rem 1.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`;

const Badge = styled.span<{ $color: string; $bg: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
  white-space: nowrap;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailSection = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  min-width: 0;
`;

const DetailSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.75rem;
`;

const DetailRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
`;

const DetailLabel = styled.span`
  font-size: 0.8125rem;
  color: #6b7280;
  min-width: 120px;
`;

const DetailValue = styled.span`
  font-size: 0.8125rem;
  color: #111827;
  font-weight: 500;
`;

const DetailList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const DetailListItem = styled.div`
  padding: 0.75rem;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
`;

const ListMain = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
`;

const ListMeta = styled.div`
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: #6b7280;
  line-height: 1.5;
`;

const LoadingState = styled.div`
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.9375rem;
`;

const EmptyState = styled.div`
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.9375rem;
`;
