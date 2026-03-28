import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  FaTimes,
  FaUser,
  FaCar,
  FaMapMarkerAlt,
  FaWrench,
  FaUserCog,
} from "react-icons/fa";
import type { IRescueRequest, RescueStatus } from "@/apis/rescue";
import RescueStepProgress from "./RescueStepProgress";

const rescueStatusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING:            { label: "Chờ xem xét",           color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  REVIEWING:          { label: "Đang xem xét",           color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  PROPOSED_ROADSIDE:  { label: "Đề xuất sửa tại chỗ",   color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  PROPOSED_TOWING:    { label: "Đề xuất kéo xe",         color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
  DISPATCHED:         { label: "Đã điều KTV",             color: "#0891b2", bg: "#cffafe", border: "#67e8f9" },
  EN_ROUTE:           { label: "KTV đang đến",            color: "#0891b2", bg: "#cffafe", border: "#67e8f9" },
  ON_SITE:            { label: "KTV đã đến nơi",          color: "#0d9488", bg: "#ccfbf1", border: "#5eead4" },
  DIAGNOSING:         { label: "Đang chẩn đoán",          color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
  REPAIRING:          { label: "Đang sửa tại chỗ",       color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  REPAIR_COMPLETE:    { label: "Sửa tại chỗ xong",       color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  TOWING_DISPATCHED:  { label: "Đã điều xe kéo",          color: "#0891b2", bg: "#cffafe", border: "#67e8f9" },
  TOWING_ACCEPTED:    { label: "KH chấp nhận kéo",        color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  TOWED:              { label: "Đã kéo về xưởng",         color: "#0d9488", bg: "#ccfbf1", border: "#5eead4" },
  INVOICED:           { label: "Đã tạo hóa đơn",          color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  INVOICE_SENT:       { label: "Đã gửi hóa đơn",          color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  PAYMENT_PENDING:    { label: "Chờ thanh toán",           color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  COMPLETED:          { label: "Hoàn thành",               color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  CANCELLED:          { label: "Đã hủy",                   color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  SPAM:               { label: "Thư rác",                  color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
};

interface RescueDetailModalProps {
  rescue: IRescueRequest;
  onClose: () => void;
}

const getStatusInfo = (status: RescueStatus | string) =>
  rescueStatusConfig[status] || {
    label: status,
    color: "#6b7280",
    bg: "#f3f4f6",
    border: "#e5e7eb",
  };

const RescueDetailModal = ({ rescue, onClose }: RescueDetailModalProps) => {
  const { t } = useTranslation();
  const statusInfo = getStatusInfo(rescue.status);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            RESCUE-{rescue.rescueId} — {rescue.problemDescription}
          </ModalTitle>
          <CloseBtn onClick={onClose}>
            <FaTimes />
          </CloseBtn>
        </ModalHeader>
        <ModalBody>
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
            </DetailSection>

            <DetailSection>
              <DetailSectionTitle>
                <FaMapMarkerAlt size={14} /> {t("rescueAddress")}
              </DetailSectionTitle>
              <DetailValue>{rescue.currentAddress}</DetailValue>
            </DetailSection>

            <DetailSection>
              <DetailSectionTitle>
                <FaWrench size={14} /> {t("rescueIssueSummary")}
              </DetailSectionTitle>
              <DetailValue>{rescue.problemDescription}</DetailValue>
            </DetailSection>

            {rescue.serviceAdvisorName && (
              <DetailSection>
                <DetailSectionTitle>
                  <FaUserCog size={14} /> {t("rescueMgrServiceAdvisor")}
                </DetailSectionTitle>
                <DetailValue>{rescue.serviceAdvisorName}</DetailValue>
              </DetailSection>
            )}
          </DetailGrid>
          <RescueStepProgress status={rescue.status} />
        </ModalBody>
        <ModalFooter>
          <Badge $color={statusInfo.color} $bg={statusInfo.bg}>
            {statusInfo.label}
          </Badge>
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
  max-width: 700px;
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
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const DetailSection = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
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
