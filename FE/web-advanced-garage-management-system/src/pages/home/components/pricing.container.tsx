import styled from "styled-components";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useAppDispatch } from "@/store/store";
import { setVisibleLogin } from "@/store/slices/appSlice";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ROUTER_PAGE } from "@/routes/contants";

const PricingContainer = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleBooking = () => {
    if (!user) {
      dispatch(setVisibleLogin(true));
      return;
    }
    navigate(ROUTER_PAGE.booking);
  };

  return (
    <Container>
      <SectionHeader>
        <SectionTitle>{t("pricingTitle")}</SectionTitle>
        <SectionDescription>
          {t("pricingDescription")}
        </SectionDescription>
      </SectionHeader>

      <PricingGrid>
        <PricingCard $featured>
          <PricingCardContent>
            <PricingTitle>{t("periodicMaintenanceTitle")}</PricingTitle>
            <PricingPrice $color="#2563eb">{t("periodicMaintenancePrice")}</PricingPrice>
            <PricingSubtitle>{t("periodicMaintenanceSubtitle")}</PricingSubtitle>
            <PricingFeatures>
              <li>{t("periodicMaintenanceFeature1")}</li>
              <li>{t("periodicMaintenanceFeature2")}</li>
              <li>{t("periodicMaintenanceFeature3")}</li>
            </PricingFeatures>
            <PricingButton $primary onClick={handleBooking}>
              {t("periodicMaintenanceButton")}
            </PricingButton>
          </PricingCardContent>
        </PricingCard>

        <PricingCard>
          <PricingCardContent>
            <PricingTitle>{t("generalRepairTitle")}</PricingTitle>
            <PricingPrice>{t("generalRepairPrice")}</PricingPrice>
            <PricingSubtitle>{t("generalRepairSubtitle")}</PricingSubtitle>
            <PricingFeatures>
              <li>{t("generalRepairFeature1")}</li>
              <li>{t("generalRepairFeature2")}</li>
              <li>{t("generalRepairFeature3")}</li>
            </PricingFeatures>
            <PricingButton onClick={handleBooking}>
              {t("generalRepairButton")}
            </PricingButton>
          </PricingCardContent>
        </PricingCard>

        <PricingCard>
          <PricingCardContent>
            <PricingTitle>{t("brakeSystemTitle")}</PricingTitle>
            <PricingPrice>{t("brakeSystemPrice")}</PricingPrice>
            <PricingSubtitle>{t("brakeSystemSubtitle")}</PricingSubtitle>
            <PricingFeatures>
              <li>{t("brakeSystemFeature1")}</li>
              <li>{t("brakeSystemFeature2")}</li>
              <li>{t("brakeSystemFeature3")}</li>
            </PricingFeatures>
            <PricingButton onClick={handleBooking}>
              {t("brakeSystemButton")}
            </PricingButton>
          </PricingCardContent>
        </PricingCard>

        <PricingCard>
          <PricingCardContent>
            <PricingTitle>{t("insuranceWarrantyTitle")}</PricingTitle>
            <PricingPrice>{t("insuranceWarrantyPrice")}</PricingPrice>
            <PricingSubtitle>{t("insuranceWarrantySubtitle")}</PricingSubtitle>
            <PricingFeatures>
              <li>{t("insuranceWarrantyFeature1")}</li>
              <li>{t("insuranceWarrantyFeature2")}</li>
              <li>{t("insuranceWarrantyFeature3")}</li>
            </PricingFeatures>
            <PricingButton onClick={handleBooking}>
              {t("insuranceWarrantyButton")}
            </PricingButton>
          </PricingCardContent>
        </PricingCard>
      </PricingGrid>
    </Container>
  );
};

export default PricingContainer;

const Container = styled.div`
  max-width: 72rem;
  margin: 0 auto;
  width: 100%;
`;

const PricingGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const PricingCard = styled.div<{ $featured?: boolean }>`
  border: 1px solid ${(props) => (props.$featured ? "#bfdbfe" : "#e5e7eb")};
  border-radius: 0.5rem;
  padding: 1.5rem;
  background-color: ${(props) => (props.$featured ? "#eff6ff" : "white")};
  min-width: 0;
`;

const PricingCardContent = styled.div`
  text-align: center;
`;

const PricingTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #6b7280;
`;

const PricingPrice = styled.div<{ $color?: string }>`
  font-size: 1.875rem;
  font-weight: bold;
  color: ${(props) => props.$color || "#111827"};
  margin-bottom: 1rem;
`;

const PricingSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const PricingFeatures = styled.ul`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
  text-align: left;

  li {
    margin-bottom: 0.5rem;
  }
`;

const PricingButton = styled.button<{ $primary?: boolean }>`
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: ${(props) => (props.$primary ? "none" : "1px solid #d1d5db")};
  background-color: ${(props) => (props.$primary ? "#2563eb" : "transparent")};
  color: ${(props) => (props.$primary ? "white" : "#374151")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.$primary ? "#1d4ed8" : "#f9fafb")};
  }
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 1rem;
`;

const SectionDescription = styled.p`
  color: #6b7280;
`;
