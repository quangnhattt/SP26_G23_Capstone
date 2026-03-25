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

const rescueStatusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING: { label: "Cho kiem tra", color: "#d97706", bg: "#fef3c7", border: "#fcd34d" },
  ACCEPTED: { label: "Da chap nhan", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  EVALUATING: { label: "Dang danh gia", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  QUOTE_SENT: { label: "Da gui bao gia", color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  CUSTOMER_APPROVED: { label: "KH dong y", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  CUSTOMER_REJECTED: { label: "KH tu choi", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  TECHNICIAN_DISPATCHED: { label: "Da dieu KTV", color: "#0891b2", bg: "#cffafe", border: "#67e8f9" },
  RESCUE_VEHICLE_DISPATCHED: { label: "Da dieu xe cuu ho", color: "#0891b2", bg: "#cffafe", border: "#67e8f9" },
  DIAGNOSING: { label: "Dang chan doan", color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
  REPAIRING_ON_SITE: { label: "Dang sua tai cho", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  NEED_TOWING: { label: "Can keo xe", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  TOWING_CONFIRMED: { label: "KH dong y keo xe", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  TOWING_REJECTED: { label: "KH tu choi keo xe", color: "#dc2626", bg: "#fee2e2", border: "#fca5a5" },
  PROPOSED_ROADSIDE: { label: "Đề xuất sửa tại chỗ", color: "#2563eb", bg: "#dbeafe", border: "#93c5fd" },
  PROPOSED_TOWING: { label: "Đề xuất kéo xe", color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
  EN_ROUTE: { label: "KTV đang đến", color: "#0891b2", bg: "#cffafe", border: "#67e8f9" },
  ON_SITE: { label: "KTV đã đến nơi", color: "#0d9488", bg: "#ccfbf1", border: "#5eead4" },
  REPAIR_COMPLETED: { label: "Sửa xong", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  INVOICE_SENT: { label: "Đã gửi hóa đơn", color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  INVOICED: { label: "Da xuat hoa don", color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd" },
  PAID: { label: "Da thanh toan", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  COMPLETED: { label: "Hoan thanh", color: "#16a34a", bg: "#dcfce7", border: "#86efac" },
  CANCELLED: { label: "Da huy", color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
  SPAM: { label: "Thu rac", color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb" },
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
