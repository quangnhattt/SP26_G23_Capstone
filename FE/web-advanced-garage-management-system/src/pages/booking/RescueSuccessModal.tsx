import styled from "styled-components";
import { useTranslation } from "react-i18next";
import {
  FaCar,
  FaCheck,
  FaFileAlt,
  FaMapMarkerAlt,
  FaUser,
} from "react-icons/fa";
import type { ICar } from "@/apis/cars/types";

interface RescueSuccessModalProps {
  vehicle: ICar | null;
  phoneNumber: string;
  address: string;
  problemDescription: string;
  imagePreview: string | null;
  onClose: () => void;
}

const RescueSuccessModal = ({
  vehicle,
  phoneNumber,
  address,
  problemDescription,
  imagePreview,
  onClose,
}: RescueSuccessModalProps) => {
  const { t } = useTranslation();

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <SuccessIcon>
            <FaCheck size={28} />
          </SuccessIcon>
          <ModalTitle>{t("rescueAlertSuccess")}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <ModalSection>
            <ModalSectionTitle>
              <FaCar size={16} /> {t("rescueVehicleInfo")}
            </ModalSectionTitle>
            <ModalValue>
              {vehicle?.brand} {vehicle?.model} — {vehicle?.licensePlate}
            </ModalValue>
          </ModalSection>

          <ModalDivider />

          <ModalSection>
            <ModalSectionTitle>
              <FaUser size={16} /> {t("rescueContactPhone")}
            </ModalSectionTitle>
            <ModalValue>{phoneNumber}</ModalValue>
          </ModalSection>

          <ModalDivider />

          <ModalSection>
            <ModalSectionTitle>
              <FaMapMarkerAlt size={16} /> {t("rescueAddress")}
            </ModalSectionTitle>
            <ModalValue>{address}</ModalValue>
          </ModalSection>

          <ModalDivider />

          <ModalSection>
            <ModalSectionTitle>
              <FaFileAlt size={16} /> {t("rescueIssueSummary")}
            </ModalSectionTitle>
            <ModalValue>{problemDescription}</ModalValue>
            {imagePreview && (
              <ImagePreview
                src={imagePreview}
                alt="Evidence"
                style={{ marginTop: "0.5rem" }}
              />
            )}
          </ModalSection>
        </ModalBody>

        <ModalFooter>
          <ModalCloseButton onClick={onClose}>
            {t("bookingBackToHome")}
          </ModalCloseButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default RescueSuccessModal;

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
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 2rem 1rem;
`;

const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #dcfce7;
  color: #16a34a;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
  text-align: center;
`;

const ModalBody = styled.div`
  padding: 1rem 2rem;
`;

const ModalSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

const ModalSectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const ModalValue = styled.div`
  font-size: 0.9375rem;
  color: #111827;
  padding-left: 1.5rem;
`;

const ModalDivider = styled.div`
  height: 1px;
  background: #f3f4f6;
  margin: 0.75rem 0;
`;

const ModalFooter = styled.div`
  padding: 1rem 2rem 2rem;
  display: flex;
  justify-content: center;
`;

const ModalCloseButton = styled.button`
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  background: #dc2626;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;

  &:hover {
    background: #b91c1c;
  }
`;

const ImagePreview = styled.img`
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  object-fit: cover;
`;
